"""Demo data seeder.

Run with: python -m app.seed

Populates one demo account with 20 products, 10 customers, and 40+ orders
spread across all statuses and the past 90 days, so the analytics charts
and LLM features have meaningful data to work with.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.customer import Customer
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product


# ---------------------------------------------------------------------------
# Raw data
# ---------------------------------------------------------------------------

PRODUCTS = [
    # Electronics
    {"name": "Wireless Headphones", "sku": "ELEC-001", "price": 79.99, "cost": 32.00, "stock_quantity": 45, "reorder_threshold": 10, "category": "Electronics", "description": "Over-ear noise-cancelling wireless headphones"},
    {"name": "USB-C Hub 7-in-1", "sku": "ELEC-002", "price": 34.99, "cost": 12.50, "stock_quantity": 8, "reorder_threshold": 15, "category": "Electronics", "description": "7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader"},
    {"name": "Mechanical Keyboard", "sku": "ELEC-003", "price": 119.99, "cost": 55.00, "stock_quantity": 22, "reorder_threshold": 8, "category": "Electronics", "description": "TKL mechanical keyboard with blue switches"},
    {"name": "Webcam 1080p", "sku": "ELEC-004", "price": 54.99, "cost": 21.00, "stock_quantity": 6, "reorder_threshold": 10, "category": "Electronics", "description": "Full HD webcam with built-in mic and autofocus"},
    {"name": "Portable Charger 20000mAh", "sku": "ELEC-005", "price": 39.99, "cost": 15.00, "stock_quantity": 60, "reorder_threshold": 20, "category": "Electronics", "description": "High-capacity power bank with fast charging"},
    # Clothing
    {"name": "Classic Crew Neck Tee", "sku": "CLTH-001", "price": 24.99, "cost": 7.00, "stock_quantity": 120, "reorder_threshold": 30, "category": "Clothing", "description": "100% cotton crew neck t-shirt, unisex fit"},
    {"name": "Slim Fit Chinos", "sku": "CLTH-002", "price": 59.99, "cost": 22.00, "stock_quantity": 4, "reorder_threshold": 15, "category": "Clothing", "description": "Slim-fit chino trousers in khaki"},
    {"name": "Zip-Up Hoodie", "sku": "CLTH-003", "price": 49.99, "cost": 18.00, "stock_quantity": 35, "reorder_threshold": 10, "category": "Clothing", "description": "Midweight fleece zip-up hoodie"},
    {"name": "Canvas Sneakers", "sku": "CLTH-004", "price": 44.99, "cost": 16.00, "stock_quantity": 28, "reorder_threshold": 10, "category": "Clothing", "description": "Low-top canvas sneakers, vulcanized sole"},
    # Home & Kitchen
    {"name": "Ceramic Pour-Over Set", "sku": "HOME-001", "price": 29.99, "cost": 10.00, "stock_quantity": 18, "reorder_threshold": 8, "category": "Home & Kitchen", "description": "Ceramic dripper with glass server and filters"},
    {"name": "Bamboo Cutting Board", "sku": "HOME-002", "price": 19.99, "cost": 6.50, "stock_quantity": 55, "reorder_threshold": 15, "category": "Home & Kitchen", "description": "Extra-large bamboo cutting board with juice groove"},
    {"name": "Stainless Steel Water Bottle", "sku": "HOME-003", "price": 27.99, "cost": 9.00, "stock_quantity": 3, "reorder_threshold": 20, "category": "Home & Kitchen", "description": "Vacuum-insulated 32oz water bottle"},
    {"name": "Non-stick Pan 10in", "sku": "HOME-004", "price": 34.99, "cost": 13.00, "stock_quantity": 14, "reorder_threshold": 8, "category": "Home & Kitchen", "description": "PFOA-free non-stick frying pan"},
    # Books
    {"name": "The Lean Startup", "sku": "BOOK-001", "price": 16.99, "cost": 5.00, "stock_quantity": 30, "reorder_threshold": 10, "category": "Books", "description": "By Eric Ries — build, measure, learn methodology"},
    {"name": "Atomic Habits", "sku": "BOOK-002", "price": 18.99, "cost": 5.50, "stock_quantity": 42, "reorder_threshold": 10, "category": "Books", "description": "By James Clear — building good habits"},
    {"name": "Designing Data-Intensive Apps", "sku": "BOOK-003", "price": 49.99, "cost": 18.00, "stock_quantity": 9, "reorder_threshold": 5, "category": "Books", "description": "By Martin Kleppmann — distributed systems deep dive"},
    # Sports
    {"name": "Resistance Band Set", "sku": "SPRT-001", "price": 22.99, "cost": 7.00, "stock_quantity": 75, "reorder_threshold": 20, "category": "Sports", "description": "Set of 5 resistance bands with door anchor and handles"},
    {"name": "Yoga Mat 6mm", "sku": "SPRT-002", "price": 31.99, "cost": 10.50, "stock_quantity": 5, "reorder_threshold": 10, "category": "Sports", "description": "Non-slip TPE yoga mat with alignment lines"},
    {"name": "Adjustable Dumbbell 25lb", "sku": "SPRT-003", "price": 89.99, "cost": 38.00, "stock_quantity": 12, "reorder_threshold": 5, "category": "Sports", "description": "Single adjustable dumbbell 5–25 lb in 5 lb increments"},
    {"name": "Jump Rope Speed Cable", "sku": "SPRT-004", "price": 14.99, "cost": 4.00, "stock_quantity": 50, "reorder_threshold": 15, "category": "Sports", "description": "Ball-bearing speed jump rope with steel cable"},
]

CUSTOMERS = [
    {"name": "Alice Morgan", "email": "alice@example.com", "phone": "555-0101"},
    {"name": "Ben Carter", "email": "ben@example.com", "phone": "555-0102"},
    {"name": "Clara Diaz", "email": "clara@example.com", "phone": None},
    {"name": "David Kim", "email": "david@example.com", "phone": "555-0104"},
    {"name": "Eva Russo", "email": "eva@example.com", "phone": "555-0105"},
    {"name": "Frank Liu", "email": None, "phone": "555-0106"},
    {"name": "Grace Patel", "email": "grace@example.com", "phone": "555-0107"},
    {"name": "Henry Walsh", "email": "henry@example.com", "phone": None},
    {"name": "Iris Chen", "email": "iris@example.com", "phone": "555-0109"},
    {"name": "James Ford", "email": "james@example.com", "phone": "555-0110"},
]

# Orders as (customer_index, status, days_ago, items: [(product_sku, qty)])
ORDER_TEMPLATES = [
    # Completed orders — drives revenue / analytics
    (0, "COMPLETED", 85, [("ELEC-001", 1), ("ELEC-005", 2)]),
    (1, "COMPLETED", 82, [("CLTH-001", 3), ("CLTH-003", 1)]),
    (2, "COMPLETED", 79, [("HOME-001", 1), ("HOME-002", 2)]),
    (3, "COMPLETED", 76, [("BOOK-001", 1), ("BOOK-002", 1)]),
    (4, "COMPLETED", 72, [("SPRT-001", 1), ("SPRT-004", 2)]),
    (5, "COMPLETED", 68, [("ELEC-003", 1)]),
    (6, "COMPLETED", 65, [("CLTH-002", 2), ("CLTH-004", 1)]),
    (7, "COMPLETED", 60, [("HOME-003", 1), ("HOME-004", 1)]),
    (8, "COMPLETED", 58, [("BOOK-003", 1)]),
    (9, "COMPLETED", 55, [("SPRT-002", 1), ("SPRT-003", 1)]),
    (0, "COMPLETED", 50, [("ELEC-002", 2), ("ELEC-004", 1)]),
    (1, "COMPLETED", 46, [("CLTH-001", 5)]),
    (2, "COMPLETED", 43, [("HOME-002", 1), ("HOME-001", 1)]),
    (3, "COMPLETED", 40, [("BOOK-001", 2), ("BOOK-003", 1)]),
    (4, "COMPLETED", 36, [("SPRT-001", 2), ("SPRT-002", 1)]),
    (5, "COMPLETED", 32, [("ELEC-001", 2)]),
    (6, "COMPLETED", 28, [("CLTH-003", 2), ("CLTH-002", 1)]),
    (7, "COMPLETED", 24, [("HOME-004", 2)]),
    (8, "COMPLETED", 21, [("BOOK-002", 3)]),
    (9, "COMPLETED", 18, [("SPRT-003", 1), ("SPRT-004", 3)]),
    (0, "COMPLETED", 14, [("ELEC-003", 1), ("ELEC-005", 1)]),
    (1, "COMPLETED", 10, [("CLTH-001", 2), ("CLTH-004", 2)]),
    (2, "COMPLETED", 7, [("HOME-001", 2)]),
    (3, "COMPLETED", 5, [("BOOK-001", 1), ("BOOK-002", 1)]),
    # Processing orders — in-flight
    (4, "PROCESSING", 3, [("SPRT-001", 1), ("SPRT-002", 1)]),
    (5, "PROCESSING", 2, [("ELEC-004", 1)]),
    (6, "PROCESSING", 2, [("CLTH-003", 1), ("CLTH-001", 2)]),
    (7, "PROCESSING", 1, [("HOME-003", 2)]),
    # Pending orders — awaiting action
    (8, "PENDING", 1, [("BOOK-003", 1)]),
    (9, "PENDING", 0, [("SPRT-004", 2), ("SPRT-001", 1)]),
    (0, "PENDING", 0, [("ELEC-001", 1)]),
    # Cancelled orders
    (1, "CANCELLED", 70, [("ELEC-003", 1)]),
    (3, "CANCELLED", 45, [("HOME-004", 1)]),
    (5, "CANCELLED", 20, [("CLTH-002", 1)]),
]


# ---------------------------------------------------------------------------
# Seeder
# ---------------------------------------------------------------------------

def seed(db: Session) -> None:
    if db.query(Product).count() > 0:
        print("Database already seeded — skipping.")
        return

    print("Seeding products...")
    sku_to_product: dict[str, Product] = {}
    for p in PRODUCTS:
        product = Product(**p)
        db.add(product)
        sku_to_product[p["sku"]] = product
    db.flush()

    print("Seeding customers...")
    customers: list[Customer] = []
    for c in CUSTOMERS:
        customer = Customer(**c)
        db.add(customer)
        customers.append(customer)
    db.flush()

    print("Seeding orders...")
    now = datetime.now(tz=timezone.utc)

    for cust_idx, status_str, days_ago, items in ORDER_TEMPLATES:
        status = OrderStatus(status_str)
        order_time = now - timedelta(days=days_ago)

        order = Order(
            customer_id=customers[cust_idx].id,
            status=status,
            created_at=order_time,
            updated_at=order_time,
            total=0,
        )
        db.add(order)
        db.flush()

        total = 0.0
        for sku, qty in items:
            product = sku_to_product[sku]
            unit_price = float(product.price)
            item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=qty,
                unit_price=unit_price,
            )
            db.add(item)
            total += unit_price * qty

            # Deduct stock only for non-cancelled orders (matches app business logic)
            if status != OrderStatus.CANCELLED:
                product.stock_quantity = max(0, product.stock_quantity - qty)

        order.total = round(total, 2)

    db.commit()
    print(
        f"Done — {len(PRODUCTS)} products, {len(CUSTOMERS)} customers, "
        f"{len(ORDER_TEMPLATES)} orders seeded."
    )


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
