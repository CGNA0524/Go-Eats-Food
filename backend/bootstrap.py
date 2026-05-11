from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import func
from werkzeug.security import generate_password_hash

from models import Bill, Category, DiningTable, Inventory, InventoryLog, MenuItem, Order, OrderItem, Recipe, Reservation, Staff, Supplier, User


def seed_sample_data(session):
    if session.query(Staff).first():
        return

    # Create default user account
    default_user = User(
        email="admin@goeats.com",
        password_hash=generate_password_hash("admin123"),
        name="Admin Manager",
        role="admin",
        is_active=True,
    )
    session.add(default_user)

    # Create core categories and minimal staff
    categories = [
        Category(category_id=1, name="Main Course", display_order=1),
        Category(category_id=2, name="Starters", display_order=2),
        Category(category_id=3, name="Beverages", display_order=3),
        Category(category_id=4, name="Desserts", display_order=4),
        Category(category_id=5, name="Essentials", display_order=5),
    ]

    # Create basic staff members
    staff = [
        Staff(staff_id=1, name="Admin User", role="admin", phone="9000000001"),
        Staff(staff_id=2, name="Waiter 1", role="waiter", phone="9000000002"),
        Staff(staff_id=3, name="Cashier 1", role="cashier", phone="9000000003"),
    ]

    # Create 15 empty dining tables
    tables = [
        DiningTable(
            table_id=i + 1,
            capacity=2 if i in {0, 1, 10, 11} else 4 if i in {2, 3, 7, 8, 12} else 6 if i in {5, 9, 13} else 8,
            location=f"{chr(65 + i // 5)}{(i % 5) + 1}",
            status="available"
        )
        for i in range(15)
    ]

    session.add_all(categories + staff + tables)


def seed_if_empty(session):
    if session.query(Staff).first():
        return False
    seed_sample_data(session)
    return True