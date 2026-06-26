"""Customers CRUD with computed order stats."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.auth import AuthUser, get_current_user
from app.database import get_db
from app.models.customer import Customer
from app.models.order import OrderStatus
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate

router = APIRouter(prefix="/customers", tags=["customers"])


def _build_response(customer: Customer) -> CustomerResponse:
    completed = [o for o in customer.orders if o.status == OrderStatus.COMPLETED]
    last_date = max((o.created_at for o in customer.orders), default=None)
    return CustomerResponse(
        id=customer.id,
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        created_at=customer.created_at,
        total_orders=len(customer.orders),
        total_spent=float(sum(o.total for o in completed)),
        last_order_date=last_date,
    )


def _get_with_orders(db: Session, customer_id: int) -> Customer:
    customer = (
        db.query(Customer)
        .options(selectinload(Customer.orders))
        .filter(Customer.id == customer_id)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")
    return customer


@router.get("", response_model=list[CustomerResponse])
def list_customers(
    db: Session = Depends(get_db),
    _: AuthUser = Depends(get_current_user),
) -> list[CustomerResponse]:
    customers = (
        db.query(Customer)
        .options(selectinload(Customer.orders))
        .order_by(Customer.name)
        .all()
    )
    return [_build_response(c) for c in customers]


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    body: CustomerCreate,
    db: Session = Depends(get_db),
    _: AuthUser = Depends(get_current_user),
) -> CustomerResponse:
    customer = Customer(**body.model_dump())
    db.add(customer)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already in use.",
        )
    db.refresh(customer)
    # New customer has no orders; accessing the relationship triggers a benign lazy load.
    return _build_response(customer)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: AuthUser = Depends(get_current_user),
) -> CustomerResponse:
    return _build_response(_get_with_orders(db, customer_id))


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    body: CustomerUpdate,
    db: Session = Depends(get_db),
    _: AuthUser = Depends(get_current_user),
) -> CustomerResponse:
    customer = _get_with_orders(db, customer_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already in use.",
        )
    # Re-query to reload orders after expire_on_commit.
    return _build_response(_get_with_orders(db, customer_id))


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: AuthUser = Depends(get_current_user),
) -> None:
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")
    try:
        db.delete(customer)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete customer — they have associated orders.",
        )
