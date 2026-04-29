from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select

from models import Inventory, InventoryLog, MenuItem, Order, OrderItem, Recipe


GST_RATE = Decimal("0.05")
SERVICE_RATE = Decimal("0.02")


def decimal_value(value) -> Decimal:
    if value is None:
        return Decimal("0")
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def calculate_bill_breakdown(order: Order):
    subtotal = sum((decimal_value(item.unit_price) * item.quantity for item in order.order_items), Decimal("0"))
    tax_amount = subtotal * GST_RATE
    service_charge = subtotal * SERVICE_RATE
    total = subtotal + tax_amount + service_charge
    return {
        "subtotal": round(subtotal, 2),
        "tax_amount": round(tax_amount, 2),
        "service_charge": round(service_charge, 2),
        "total": round(total, 2),
    }


def order_elapsed_minutes(order: Order) -> int:
    delta = datetime.utcnow() - order.created_at
    return max(int(delta.total_seconds() // 60), 0)


def summarize_order_items(order: Order) -> str:
    parts = []
    for item in order.order_items:
        name = item.menu_item.name if item.menu_item else f"Item {item.item_id}"
        parts.append(f"{name} x{item.quantity}")
    return ", ".join(parts)


def apply_inventory_deduction(session, order: Order, staff_id: int):
    order_items = order.order_items
    item_ids = [item.item_id for item in order_items]
    if not item_ids:
        return []

    recipe_rows = session.query(Recipe).filter(Recipe.item_id.in_(item_ids)).all()
    used_by_inventory = defaultdict(float)
    quantity_map = {item.item_id: item.quantity for item in order_items}
    for recipe in recipe_rows:
        used_by_inventory[recipe.inventory_id] += float(recipe.qty_used) * float(quantity_map.get(recipe.item_id, 0))

    if not used_by_inventory:
        return []

    inventories = session.query(Inventory).filter(Inventory.inventory_id.in_(list(used_by_inventory.keys()))).with_for_update().all()
    inventory_map = {row.inventory_id: row for row in inventories}
    logs = []
    for inventory_id, change_amount in used_by_inventory.items():
        inventory_item = inventory_map.get(inventory_id)
        if not inventory_item:
            continue
        inventory_item.quantity = float(inventory_item.quantity) - change_amount
        logs.append(
            InventoryLog(
                inventory_id=inventory_id,
                change_amount=-change_amount,
                change_type="deduction",
                staff_id=staff_id,
            )
        )
    session.add_all(logs)
    return logs
