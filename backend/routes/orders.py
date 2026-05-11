from __future__ import annotations

from datetime import datetime

from flask import Blueprint, request

from auth import require_roles
try:
    from ..db import session_scope
    from ..models import DiningTable, MenuItem, Order, OrderItem, Staff
except ImportError:
    from db import session_scope
    from models import DiningTable, MenuItem, Order, OrderItem, Staff
from routes import json_response
from services import apply_inventory_deduction, calculate_bill_breakdown, order_elapsed_minutes, summarize_order_items


orders_bp = Blueprint("orders_bp", __name__)


def _parse_date(value):
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def _serialize_order(order):
    breakdown = calculate_bill_breakdown(order)
    return {
        "order_id": order.order_id,
        "table_id": order.table_id,
        "staff_id": order.staff_id,
        "status": order.status,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
        "notes": order.notes,
        "elapsed_minutes": order_elapsed_minutes(order),
        "item_summary": summarize_order_items(order),
        "subtotal": float(breakdown["subtotal"]),
        "total": float(breakdown["total"]),
        "items": [
            {
                "order_item_id": item.order_item_id,
                "item_id": item.item_id,
                "name": item.menu_item.name if item.menu_item else None,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "special_notes": item.special_notes,
            }
            for item in order.order_items
        ],
    }


@orders_bp.get("/api/orders")
def list_orders():
    try:
        status = request.args.get("status")
        table_id = request.args.get("table_id", type=int)
        start_date = _parse_date(request.args.get("start_date"))
        end_date = _parse_date(request.args.get("end_date"))

        with session_scope() as session:
            query = session.query(Order)
            if status:
                query = query.filter(Order.status == status)
            if table_id:
                query = query.filter(Order.table_id == table_id)
            if start_date:
                query = query.filter(Order.created_at >= start_date)
            if end_date:
                query = query.filter(Order.created_at <= end_date)
            orders = query.order_by(Order.created_at.desc()).all()
            return json_response({"data": [_serialize_order(order) for order in orders]})
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@orders_bp.post("/api/orders")
@require_roles("admin", "waiter")
def create_order():
    try:
        payload = request.get_json(force=True)
        table_id = payload.get("table_id")
        staff_id = payload.get("staff_id")
        items = payload.get("items", [])
        notes = payload.get("notes")
        if not table_id or not staff_id or not items:
            return json_response({"error": "table_id, staff_id and items are required"}, 400)

        with session_scope() as session:
            table = session.get(DiningTable, table_id)
            staff = session.get(Staff, staff_id)
            if not table or not staff:
                return json_response({"error": "Invalid table or staff"}, 400)

            order = Order(table_id=table_id, staff_id=staff_id, notes=notes, status=payload.get("status", "pending"))
            session.add(order)
            session.flush()

            for item in items:
                menu_item = session.get(MenuItem, item.get("item_id"))
                if not menu_item:
                    return json_response({"error": f"Menu item {item.get('item_id')} not found"}, 400)
                order_item = OrderItem(
                    order_id=order.order_id,
                    item_id=menu_item.item_id,
                    quantity=int(item.get("quantity", 1)),
                    unit_price=menu_item.price,
                    special_notes=item.get("special_notes"),
                )
                session.add(order_item)

            table.status = "occupied"
            session.flush()
            return json_response({"data": _serialize_order(order)}, 201)
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@orders_bp.put("/api/orders/<int:order_id>/status")
@require_roles("admin", "waiter", "kitchen")
def update_status(order_id):
    try:
        payload = request.get_json(force=True)
        new_status = payload.get("status")
        staff_id = payload.get("staff_id")
        if new_status not in {"pending", "cooking", "ready", "served", "billed"}:
            return json_response({"error": "Invalid status"}, 400)

        with session_scope() as session:
            order = session.get(Order, order_id)
            if not order:
                return json_response({"error": "Order not found"}, 404)
            previous_status = order.status
            order.status = new_status
            if new_status == "served" and previous_status != "served":
                apply_inventory_deduction(session, order, staff_id or order.staff_id)
            table = session.get(DiningTable, order.table_id)
            if table and new_status != "billed":
                table.status = "occupied"
            if new_status == "billed" and table:
                table.status = "available"
            session.flush()
            return json_response({"data": _serialize_order(order)})
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@orders_bp.get("/api/orders/<int:order_id>/bill")
def order_bill(order_id):
    try:
        with session_scope() as session:
            order = session.get(Order, order_id)
            if not order:
                return json_response({"error": "Order not found"}, 404)
            breakdown = calculate_bill_breakdown(order)
            return json_response(
                {
                    "data": {
                        "order_id": order.order_id,
                        "table_id": order.table_id,
                        "items": [
                            {
                                "item_id": item.item_id,
                                "name": item.menu_item.name if item.menu_item else None,
                                "quantity": item.quantity,
                                "unit_price": float(item.unit_price),
                                "line_total": float(item.unit_price) * item.quantity,
                            }
                            for item in order.order_items
                        ],
                        **{key: float(value) for key, value in breakdown.items()},
                    }
                }
            )
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)
