"""Analytics — summary KPIs and chart data."""

from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import cast, func
from sqlalchemy.types import Date as SADate
from sqlalchemy.orm import Session

from app.core.auth import AuthUser, get_current_user
from app.database import get_db
from app.models.customer import Customer
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.schemas.analytics import AnalyticsSummary, DailyRevenue, OrderStatusCount, TopProduct

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def get_summary(
    days: Optional[int] = Query(default=None, ge=1, le=365),
    db: Session = Depends(get_db),
    _: AuthUser = Depends(get_current_user),
) -> AnalyticsSummary:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)) if days else None

    def with_cutoff(q):
        return q.filter(Order.created_at >= cutoff) if cutoff else q

    # Scalar KPIs — date-filtered when days is set
    total_revenue = float(
        with_cutoff(
            db.query(func.coalesce(func.sum(Order.total), 0))
            .filter(Order.status == OrderStatus.COMPLETED)
        ).scalar()
        or 0
    )
    total_orders = with_cutoff(db.query(func.count(Order.id))).scalar() or 0
    completed_orders = (
        with_cutoff(
            db.query(func.count(Order.id)).filter(Order.status == OrderStatus.COMPLETED)
        ).scalar()
        or 0
    )
    avg_order_value = total_revenue / completed_orders if completed_orders > 0 else 0.0

    # These KPIs reflect current state, not date-filtered
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_products = db.query(func.count(Product.id)).scalar() or 0
    low_stock_count = (
        db.query(func.count(Product.id))
        .filter(Product.stock_quantity > 0)
        .filter(Product.stock_quantity <= Product.reorder_threshold)
        .scalar()
        or 0
    )
    out_of_stock_count = (
        db.query(func.count(Product.id)).filter(Product.stock_quantity == 0).scalar() or 0
    )

    # Revenue by day — fill gaps with zero across the selected window
    if days is not None:
        num_days = days
        chart_start = datetime.now(timezone.utc) - timedelta(days=days - 1)
    else:
        # All-time: find oldest completed order, cap at 365 days
        oldest = (
            db.query(func.min(Order.created_at))
            .filter(Order.status == OrderStatus.COMPLETED)
            .scalar()
        )
        if oldest:
            if oldest.tzinfo is None:
                oldest = oldest.replace(tzinfo=timezone.utc)
            num_days = min((datetime.now(timezone.utc) - oldest).days + 1, 365)
        else:
            num_days = 30
        chart_start = datetime.now(timezone.utc) - timedelta(days=num_days - 1)

    revenue_rows = (
        db.query(
            cast(Order.created_at, SADate).label("day"),
            func.sum(Order.total).label("revenue"),
        )
        .filter(Order.status == OrderStatus.COMPLETED)
        .filter(Order.created_at >= chart_start)
        .group_by(cast(Order.created_at, SADate))
        .all()
    )
    date_map = {row.day: float(row.revenue) for row in revenue_rows}
    today = date.today()
    revenue_by_day = [
        DailyRevenue(
            date=(today - timedelta(days=num_days - 1 - i)).isoformat(),
            revenue=date_map.get(today - timedelta(days=num_days - 1 - i), 0.0),
        )
        for i in range(num_days)
    ]

    # Top 5 products by revenue — date-filtered
    top_rows = (
        with_cutoff(
            db.query(
                Product.name,
                func.sum(OrderItem.unit_price * OrderItem.quantity).label("revenue"),
            )
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order, Order.id == OrderItem.order_id)
            .filter(Order.status == OrderStatus.COMPLETED)
        )
        .group_by(Product.id, Product.name)
        .order_by(func.sum(OrderItem.unit_price * OrderItem.quantity).desc())
        .limit(5)
        .all()
    )
    top_products = [TopProduct(name=row.name, revenue=float(row.revenue)) for row in top_rows]

    # Orders by status — date-filtered
    status_rows = (
        with_cutoff(db.query(Order.status, func.count(Order.id).label("count")))
        .group_by(Order.status)
        .all()
    )
    orders_by_status = [
        OrderStatusCount(status=row.status, count=row.count) for row in status_rows
    ]

    return AnalyticsSummary(
        total_revenue=total_revenue,
        total_orders=total_orders,
        completed_orders=completed_orders,
        avg_order_value=avg_order_value,
        total_customers=total_customers,
        total_products=total_products,
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
        revenue_by_day=revenue_by_day,
        top_products=top_products,
        orders_by_status=orders_by_status,
    )
