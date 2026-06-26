"""AI / LLM routes — inventory analysis and sales summarization via OpenRouter."""

import json
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy import cast, func
from sqlalchemy.orm import Session
from sqlalchemy.types import Date as SADate

from app.config import settings
from app.core.auth import AuthUser, get_current_user
from app.database import get_db
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.schemas.ai import InventoryAnalysis, SalesSummary

router = APIRouter(prefix="/ai", tags=["ai"])

OPENROUTER_BASE = "https://openrouter.ai/api/v1"

_INVENTORY_SYSTEM = """You are a business intelligence assistant for a merchant dashboard.
You will receive a JSON snapshot of the merchant's current product inventory.
Respond with a JSON object that matches this schema exactly — no markdown, no code fences, raw JSON only:
{
  "summary": "string (2-3 sentences giving an overall inventory health assessment)",
  "critical_items": [
    {"product_name": "string", "current_stock": number, "threshold": number, "recommendation": "string"}
  ],
  "reorder_recommendations": [
    {"product_name": "string", "current_stock": number, "threshold": number, "recommendation": "string"}
  ],
  "insights": ["string (actionable bullet)", ...]
}
critical_items: products that are out of stock (stock=0) or at/below their reorder_threshold.
reorder_recommendations: products approaching threshold (within 150% of threshold but above it).
insights: exactly 3-5 concise, actionable observations about inventory health, risks, or patterns."""

_SALES_SYSTEM = """You are a business intelligence assistant for a merchant dashboard.
You will receive a JSON snapshot of recent sales data.
Respond with a JSON object that matches this schema exactly — no markdown, no code fences, raw JSON only:
{
  "headline": "string (one bold sentence summarising overall performance)",
  "total_revenue_insight": "string (one sentence about revenue trends)",
  "top_performer": "string (product name + brief reason it leads)",
  "trend": "growing",
  "key_insights": ["string", ...],
  "recommendations": ["string", ...]
}
trend must be exactly one of: "growing", "declining", "stable".
key_insights: exactly 3-5 data-driven observations.
recommendations: exactly 2-3 specific actionable suggestions."""


def _call_openrouter(messages: list[dict], model: str) -> str:
    resp = httpx.post(
        f"{OPENROUTER_BASE}/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "HTTP-Referer": "https://commercio.app",
            "X-Title": "Commercio",
        },
        json={
            "model": model,
            "messages": messages,
            "response_format": {"type": "json_object"},
        },
        timeout=90.0,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def _llm_structured(system: str, user: str, schema_class: type) -> object:
    models = settings.openrouter_models_list
    if not settings.openrouter_api_key:
        raise HTTPException(503, detail="OPENROUTER_API_KEY is not configured in .env")
    if not models:
        raise HTTPException(503, detail="OPENROUTER_MODELS is not configured in .env")

    base_messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
    last_err = "Unknown error"

    for model in models:
        try:
            raw = _call_openrouter(base_messages, model)
            try:
                return schema_class.model_validate_json(raw)
            except (ValidationError, json.JSONDecodeError, ValueError) as parse_err:
                repair_messages = base_messages + [
                    {"role": "assistant", "content": raw},
                    {
                        "role": "user",
                        "content": (
                            f"Your response failed schema validation: {parse_err}\n"
                            "Return ONLY the corrected JSON object with no extra text or markdown."
                        ),
                    },
                ]
                fixed = _call_openrouter(repair_messages, model)
                return schema_class.model_validate_json(fixed)
        except HTTPException:
            raise
        except Exception as exc:
            last_err = str(exc)
            continue

    raise HTTPException(502, detail=f"All LLM models failed. Last error: {last_err}")


@router.post("/inventory-analysis", response_model=InventoryAnalysis)
def inventory_analysis(
    db: Session = Depends(get_db),
    _: AuthUser = Depends(get_current_user),
) -> InventoryAnalysis:
    products = db.query(Product).all()
    if not products:
        raise HTTPException(400, detail="No products in inventory to analyse")

    payload = [
        {
            "name": p.name,
            "sku": p.sku,
            "stock_quantity": p.stock_quantity,
            "reorder_threshold": p.reorder_threshold,
            "price": float(p.price),
            "cost": float(p.cost) if p.cost else None,
        }
        for p in products
    ]
    total = len(products)
    out_of_stock = sum(1 for p in products if p.stock_quantity == 0)
    low = sum(1 for p in products if 0 < p.stock_quantity <= p.reorder_threshold)

    user_msg = (
        f"Inventory snapshot: {total} products total, "
        f"{out_of_stock} out of stock, {low} at or below reorder threshold.\n\n"
        + json.dumps(payload, indent=2)
    )
    return _llm_structured(_INVENTORY_SYSTEM, user_msg, InventoryAnalysis)


@router.post("/sales-summary", response_model=SalesSummary)
def sales_summary(
    db: Session = Depends(get_db),
    _: AuthUser = Depends(get_current_user),
) -> SalesSummary:
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    if total_orders == 0:
        raise HTTPException(400, detail="No orders to summarise yet")

    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

    total_revenue = float(
        db.query(func.coalesce(func.sum(Order.total), 0))
        .filter(Order.status == OrderStatus.COMPLETED)
        .scalar()
        or 0
    )
    completed = (
        db.query(func.count(Order.id)).filter(Order.status == OrderStatus.COMPLETED).scalar() or 0
    )
    recent_revenue = float(
        db.query(func.coalesce(func.sum(Order.total), 0))
        .filter(Order.status == OrderStatus.COMPLETED)
        .filter(Order.created_at >= thirty_days_ago)
        .scalar()
        or 0
    )
    recent_orders = (
        db.query(func.count(Order.id))
        .filter(Order.created_at >= thirty_days_ago)
        .scalar()
        or 0
    )

    top_rows = (
        db.query(
            Product.name,
            func.sum(OrderItem.unit_price * OrderItem.quantity).label("rev"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status == OrderStatus.COMPLETED)
        .group_by(Product.id, Product.name)
        .order_by(func.sum(OrderItem.unit_price * OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    rev_rows = (
        db.query(
            cast(Order.created_at, SADate).label("day"),
            func.sum(Order.total).label("revenue"),
        )
        .filter(Order.status == OrderStatus.COMPLETED)
        .filter(Order.created_at >= thirty_days_ago)
        .group_by(cast(Order.created_at, SADate))
        .order_by(cast(Order.created_at, SADate))
        .all()
    )

    payload = {
        "period": "last 30 days",
        "all_time_revenue": total_revenue,
        "all_time_orders": total_orders,
        "all_time_completed_orders": completed,
        "last_30d_revenue": recent_revenue,
        "last_30d_orders": recent_orders,
        "top_products_by_revenue": [{"name": r.name, "revenue": float(r.rev)} for r in top_rows],
        "daily_revenue_last_30d": [{"date": str(r.day), "revenue": float(r.revenue)} for r in rev_rows],
    }

    user_msg = "Sales data snapshot:\n\n" + json.dumps(payload, indent=2)
    return _llm_structured(_SALES_SYSTEM, user_msg, SalesSummary)
