from __future__ import annotations

from datetime import datetime

from flask import Blueprint, request

from auth import require_roles
try:
    from ..db import session_scope
    from ..models import Inventory, InventoryLog, Staff
except ImportError:
    from db import session_scope
    from models import Inventory, InventoryLog, Staff
from routes import json_response


inventory_bp = Blueprint("inventory_bp", __name__)


def _stock_status(quantity, min_threshold):
    if quantity < min_threshold:
        return "Low"
    baseline = max(min_threshold * 5, 1)
    ratio = quantity / baseline
    if ratio > 0.5:
        return "In Stock"
    if ratio >= 0.2:
        return "Medium"
    return "Low"


@inventory_bp.get("/api/inventory")
def list_inventory():
    try:
        category = request.args.get("category")
        search = request.args.get("search", "").strip().lower()
        with session_scope() as session:
            query = session.query(Inventory)
            if category:
                query = query.filter(Inventory.category == category)
            rows = query.order_by(Inventory.name.asc()).all()
            payload = []
            for item in rows:
                if search and search not in item.name.lower():
                    continue
                payload.append(
                    {
                        "inventory_id": item.inventory_id,
                        "name": item.name,
                        "category": item.category,
                        "quantity": float(item.quantity),
                        "unit": item.unit,
                        "min_threshold": float(item.min_threshold),
                        "cost_per_unit": float(item.cost_per_unit),
                        "supplier_id": item.supplier_id,
                        "last_restocked": item.last_restocked.isoformat() if item.last_restocked else None,
                        "stock_status": _stock_status(float(item.quantity), float(item.min_threshold)),
                        "alert": float(item.quantity) < float(item.min_threshold),
                    }
                )
            return json_response({"data": payload})
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@inventory_bp.put("/api/inventory/<int:inventory_id>")
@require_roles("admin", "waiter")
def restock_inventory(inventory_id):
    try:
        payload = request.get_json(force=True)
        quantity = float(payload.get("quantity", 0))
        staff_id = payload.get("staff_id")
        if quantity <= 0 or not staff_id:
            return json_response({"error": "quantity and staff_id are required"}, 400)

        with session_scope() as session:
            item = session.get(Inventory, inventory_id)
            staff = session.get(Staff, staff_id)
            if not item or not staff:
                return json_response({"error": "Inventory item or staff not found"}, 404)
            item.quantity = float(item.quantity) + quantity
            item.last_restocked = datetime.utcnow()
            session.add(
                InventoryLog(
                    inventory_id=inventory_id,
                    change_amount=quantity,
                    change_type="restock",
                    staff_id=staff_id,
                )
            )
            session.flush()
            return json_response(
                {
                    "data": {
                        "inventory_id": item.inventory_id,
                        "quantity": float(item.quantity),
                        "stock_status": _stock_status(float(item.quantity), float(item.min_threshold)),
                    }
                }
            )
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@inventory_bp.get("/api/inventory/logs")
def inventory_logs():
    try:
        with session_scope() as session:
            rows = session.query(InventoryLog).order_by(InventoryLog.changed_at.desc()).limit(100).all()
            return json_response(
                {
                    "data": [
                        {
                            "log_id": row.log_id,
                            "inventory_id": row.inventory_id,
                            "change_amount": float(row.change_amount),
                            "change_type": row.change_type,
                            "changed_at": row.changed_at.isoformat() if row.changed_at else None,
                            "staff_id": row.staff_id,
                        }
                        for row in rows
                    ]
                }
            )
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@inventory_bp.post("/api/inventory")
@require_roles("admin")
def create_inventory():
    try:
        payload = request.get_json(force=True)
        name = payload.get("name", "").strip()
        category = payload.get("category", "").strip()
        quantity = float(payload.get("quantity", 0))
        unit = payload.get("unit", "").strip()
        min_threshold = float(payload.get("min_threshold", 0))
        cost_per_unit = float(payload.get("cost_per_unit", 0))
        supplier_id = payload.get("supplier_id")

        if not all([name, category, unit]):
            return json_response({"error": "name, category and unit are required"}, 400)

        with session_scope() as session:
            item = Inventory(
                name=name,
                category=category,
                quantity=quantity,
                unit=unit,
                min_threshold=min_threshold,
                cost_per_unit=cost_per_unit,
                supplier_id=supplier_id,
                last_restocked=datetime.utcnow(),
            )
            session.add(item)
            session.flush()
            return json_response({"data": {"inventory_id": item.inventory_id}}, 201)
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@inventory_bp.put("/api/inventory/<int:inventory_id>")
@require_roles("admin", "waiter")
def update_inventory(inventory_id):
    try:
        payload = request.get_json(force=True)
        
        # Check if this is a restock operation (old endpoint behavior)
        if "staff_id" in payload and "quantity" in payload and len(payload) == 2:
            quantity = float(payload.get("quantity", 0))
            staff_id = payload.get("staff_id")
            if quantity <= 0 or not staff_id:
                return json_response({"error": "quantity and staff_id are required"}, 400)

            with session_scope() as session:
                item = session.get(Inventory, inventory_id)
                staff = session.get(Staff, staff_id)
                if not item or not staff:
                    return json_response({"error": "Inventory item or staff not found"}, 404)
                item.quantity = float(item.quantity) + quantity
                item.last_restocked = datetime.utcnow()
                session.add(
                    InventoryLog(
                        inventory_id=inventory_id,
                        change_amount=quantity,
                        change_type="restock",
                        staff_id=staff_id,
                    )
                )
                session.flush()
                return json_response(
                    {
                        "data": {
                            "inventory_id": item.inventory_id,
                            "quantity": float(item.quantity),
                            "stock_status": _stock_status(float(item.quantity), float(item.min_threshold)),
                        }
                    }
                )
        else:
            # General update
            with session_scope() as session:
                item = session.get(Inventory, inventory_id)
                if not item:
                    return json_response({"error": "Inventory item not found"}, 404)
                
                for key, value in payload.items():
                    if key in ["name", "category", "quantity", "unit", "min_threshold", "cost_per_unit", "supplier_id"]:
                        if key in ["quantity", "min_threshold", "cost_per_unit"]:
                            value = float(value)
                        setattr(item, key, value)
                
                session.flush()
                return json_response(
                    {
                        "data": {
                            "inventory_id": item.inventory_id,
                            "name": item.name,
                            "quantity": float(item.quantity),
                            "stock_status": _stock_status(float(item.quantity), float(item.min_threshold)),
                        }
                    }
                )
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@inventory_bp.delete("/api/inventory/<int:inventory_id>")
@require_roles("admin")
def delete_inventory(inventory_id):
    try:
        with session_scope() as session:
            item = session.get(Inventory, inventory_id)
            if not item:
                return json_response({"error": "Inventory item not found"}, 404)
            session.delete(item)
            session.flush()
            return json_response({"data": {"deleted": inventory_id}})
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)
