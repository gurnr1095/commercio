"""Orders CRUD with 4-state lifecycle, stock deduction, and restock on cancel."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.core.auth import AuthUser, get_current_user
from app.database import get_db
from app.models.customer import Customer
from app.models.order import VALID_TRANSITIONS, Order, OrderItem, OrderStatus
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["orders"])


def _build_response(order: Order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.name,
        status=order.status,
        total=float(order.total),
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=[
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "subtotal": float(item.unit_price) * item.quantity,
            }
            for item in order.items
        ],
    )


def _load_full(db: Session, order_id: int) -> Order:
    order = (
        db.query(Order)
        .options(
            selectinload(Order.customer),
            selectinload(Order.items).selectinload(OrderItem.product),
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return order


@router.get("", response_model=list[OrderResponse])
def list_orders(
    db: Session = Depends(get_db),
    _: AuthUser = Depends(get_current_user),
) -> list[OrderResponse]:
    orders = (
        db.query(Order)
        .options(
            selectinload(Order.customer),
            selectinload(Order.items).selectinload(OrderItem.product),
        )
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_build_response(o) for o in orders]


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    body: OrderCreate,
    db: Session = Depends(get_db),
    _: AuthUser = Depends(get_current_user),
) -> OrderResponse:
    # Validate unique product IDs
    ids = [i.product_id for i in body.items]
    if len(ids) != len(set(ids)):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Duplicate product IDs in order. Combine quantities instead.",
        )

    # Validate customer
    customer = db.get(Customer, body.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found."
        )

    # Validate stock for all items before touching anything
    products: dict[int, Product] = {}
    for item in body.items:
        product = db.get(Product, item.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found.",
            )
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Insufficient stock for '{product.name}': {product.stock_quantity} available, {item.quantity} requested.",
            )
        products[item.product_id] = product

    # Create order
    order = Order(customer_id=body.customer_id, status=OrderStatus.PENDING, total=0)
    db.add(order)
    db.flush()  # get order.id before creating items

    total = 0.0
    for item in body.items:
        product = products[item.product_id]
        unit_price = float(product.price)
        product.stock_quantity -= item.quantity
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=unit_price,
        )
        db.add(order_item)
        total += unit_price * item.quantity

    order.total = total
    db.commit()
    return _build_response(_load_full(db, order.id))


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: AuthUser = Depends(get_current_user),
) -> OrderResponse:
    return _build_response(_load_full(db, order_id))


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    body: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: AuthUser = Depends(get_current_user),
) -> OrderResponse:
    order = _load_full(db, order_id)
    new_status = body.status

    if new_status not in VALID_TRANSITIONS[order.status]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Cannot transition from {order.status} to {new_status}.",
        )

    # Restock when cancelling from PROCESSING
    if order.status == OrderStatus.PROCESSING and new_status == OrderStatus.CANCELLED:
        for item in order.items:
            item.product.stock_quantity += item.quantity

    order.status = new_status
    db.commit()
    return _build_response(_load_full(db, order_id))
