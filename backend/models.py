from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from db import Base


ORDER_STATUSES = ("pending", "cooking", "ready", "served", "billed")


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True)
    email = Column(String(160), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(160), nullable=False)
    role = Column(String(50), nullable=False, default="admin")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


TABLE_STATUSES = ("available", "occupied", "reserved")
RESERVATION_STATUSES = ("reserved", "seated", "cancelled", "completed")
PAYMENT_MODES = ("Cash", "UPI", "Card", "Split")
CHANGE_TYPES = ("deduction", "restock")
ROLES = ("admin", "waiter", "cashier", "kitchen")


class Staff(Base):
    __tablename__ = "staff"

    staff_id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    role = Column(Enum(*ROLES, name="staff_role"), nullable=False)
    phone = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    orders = relationship("Order", back_populates="staff")
    bills = relationship("Bill", back_populates="staff")
    logs = relationship("InventoryLog", back_populates="staff")


class DiningTable(Base):
    __tablename__ = "tables"

    table_id = Column(Integer, primary_key=True)
    capacity = Column(Integer, nullable=False)
    location = Column(String(120), nullable=True)
    status = Column(Enum(*TABLE_STATUSES, name="table_status"), nullable=False, default="available")

    reservations = relationship("Reservation", back_populates="table")
    orders = relationship("Order", back_populates="table")


class Reservation(Base):
    __tablename__ = "reservations"

    reservation_id = Column(Integer, primary_key=True)
    table_id = Column(Integer, ForeignKey("tables.table_id"), nullable=False)
    customer_name = Column(String(120), nullable=False)
    party_size = Column(Integer, nullable=False)
    reserved_at = Column(DateTime, nullable=False)
    status = Column(Enum(*RESERVATION_STATUSES, name="reservation_status"), nullable=False, default="reserved")

    table = relationship("DiningTable", back_populates="reservations")


class Category(Base):
    __tablename__ = "categories"

    category_id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False, unique=True)
    display_order = Column(Integer, nullable=False, default=0)


class MenuItem(Base):
    __tablename__ = "menu_items"

    item_id = Column(Integer, primary_key=True)
    name = Column(String(160), nullable=False)
    category = Column(String(120), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    is_available = Column(Boolean, nullable=False, default=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)

    order_items = relationship("OrderItem", back_populates="menu_item")
    recipes = relationship("Recipe", back_populates="menu_item")


class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True)
    table_id = Column(Integer, ForeignKey("tables.table_id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.staff_id"), nullable=False)
    status = Column(Enum(*ORDER_STATUSES, name="order_status"), nullable=False, default="pending")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    notes = Column(Text, nullable=True)

    table = relationship("DiningTable", back_populates="orders")
    staff = relationship("Staff", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    bill = relationship("Bill", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    order_item_id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False)
    item_id = Column(Integer, ForeignKey("menu_items.item_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    special_notes = Column(Text, nullable=True)

    order = relationship("Order", back_populates="order_items")
    menu_item = relationship("MenuItem", back_populates="order_items")


class Bill(Base):
    __tablename__ = "bills"

    bill_id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False, unique=True)
    subtotal = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), nullable=False)
    service_charge = Column(Numeric(10, 2), nullable=False)
    total = Column(Numeric(10, 2), nullable=False)
    payment_mode = Column(Enum(*PAYMENT_MODES, name="payment_mode"), nullable=False)
    billed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    staff_id = Column(Integer, ForeignKey("staff.staff_id"), nullable=False)

    order = relationship("Order", back_populates="bill")
    staff = relationship("Staff", back_populates="bills")


class Supplier(Base):
    __tablename__ = "suppliers"

    supplier_id = Column(Integer, primary_key=True)
    name = Column(String(160), nullable=False)
    contact = Column(String(60), nullable=True)
    email = Column(String(160), nullable=True)

    inventory_items = relationship("Inventory", back_populates="supplier")


class Inventory(Base):
    __tablename__ = "inventory"

    inventory_id = Column(Integer, primary_key=True)
    name = Column(String(160), nullable=False)
    category = Column(String(120), nullable=False)
    quantity = Column(Float, nullable=False, default=0)
    unit = Column(String(30), nullable=False)
    min_threshold = Column(Float, nullable=False, default=0)
    cost_per_unit = Column(Numeric(10, 2), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"), nullable=True)
    last_restocked = Column(DateTime, nullable=True)

    supplier = relationship("Supplier", back_populates="inventory_items")
    recipes = relationship("Recipe", back_populates="inventory_item")
    logs = relationship("InventoryLog", back_populates="inventory_item")


class Recipe(Base):
    __tablename__ = "recipes"

    recipe_id = Column(Integer, primary_key=True)
    item_id = Column(Integer, ForeignKey("menu_items.item_id"), nullable=False)
    inventory_id = Column(Integer, ForeignKey("inventory.inventory_id"), nullable=False)
    qty_used = Column(Float, nullable=False)
    unit = Column(String(30), nullable=False)

    menu_item = relationship("MenuItem", back_populates="recipes")
    inventory_item = relationship("Inventory", back_populates="recipes")


class InventoryLog(Base):
    __tablename__ = "inventory_log"

    log_id = Column(Integer, primary_key=True)
    inventory_id = Column(Integer, ForeignKey("inventory.inventory_id"), nullable=False)
    change_amount = Column(Float, nullable=False)
    change_type = Column(Enum(*CHANGE_TYPES, name="inventory_change_type"), nullable=False)
    changed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    staff_id = Column(Integer, ForeignKey("staff.staff_id"), nullable=False)

    inventory_item = relationship("Inventory", back_populates="logs")
    staff = relationship("Staff", back_populates="logs")


Index("ix_orders_status", Order.status)
Index("ix_orders_table_id", Order.table_id)
Index("ix_orders_created_at", Order.created_at)
Index("ix_bills_billed_at", Bill.billed_at)
