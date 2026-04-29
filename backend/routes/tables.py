from __future__ import annotations

from datetime import datetime

from flask import Blueprint, request

from auth import require_roles
from db import session_scope
from models import DiningTable, Order, Reservation
from routes import json_response
from services import calculate_bill_breakdown, order_elapsed_minutes, summarize_order_items


tables_bp = Blueprint("tables_bp", __name__)


def _serialize_table(session, table):
    active_order = (
        session.query(Order)
        .filter(Order.table_id == table.table_id, Order.status != "billed")
        .order_by(Order.created_at.desc())
        .first()
    )
    active_reservation = (
        session.query(Reservation)
        .filter(Reservation.table_id == table.table_id, Reservation.status == "reserved")
        .order_by(Reservation.reserved_at.desc())
        .first()
    )
    bill_total = 0.0
    elapsed = None
    item_summary = ""
    if active_order:
        breakdown = calculate_bill_breakdown(active_order)
        bill_total = float(breakdown["total"])
        elapsed = order_elapsed_minutes(active_order)
        item_summary = summarize_order_items(active_order)
    return {
        "table_id": table.table_id,
        "capacity": table.capacity,
        "location": table.location,
        "status": table.status,
        "current_order": active_order.order_id if active_order else None,
        "guests_count": active_reservation.party_size if active_reservation else None,
        "running_bill_total": bill_total,
        "time_occupied_minutes": elapsed,
        "item_summary": item_summary,
    }


@tables_bp.get("/api/tables")
def list_tables():
    try:
        with session_scope() as session:
            rows = session.query(DiningTable).order_by(DiningTable.table_id.asc()).all()
            return json_response({"data": [_serialize_table(session, table) for table in rows]})
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@tables_bp.put("/api/tables/<int:table_id>")
@require_roles("admin", "waiter")
def update_table(table_id):
    try:
        payload = request.get_json(force=True)
        status = payload.get("status")
        if status not in {"available", "occupied", "reserved"}:
            return json_response({"error": "Invalid table status"}, 400)
        with session_scope() as session:
            table = session.get(DiningTable, table_id)
            if not table:
                return json_response({"error": "Table not found"}, 404)
            table.status = status
            session.flush()
            return json_response({"data": _serialize_table(session, table)})
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@tables_bp.post("/api/reservations")
@require_roles("admin", "waiter")
def create_reservation():
    try:
        payload = request.get_json(force=True)
        table_id = payload.get("table_id")
        customer_name = payload.get("customer_name")
        party_size = payload.get("party_size")
        reserved_at = payload.get("reserved_at")
        if not all([table_id, customer_name, party_size, reserved_at]):
            return json_response({"error": "table_id, customer_name, party_size and reserved_at are required"}, 400)
        with session_scope() as session:
            table = session.get(DiningTable, table_id)
            if not table:
                return json_response({"error": "Table not found"}, 404)
            reservation = Reservation(
                table_id=table_id,
                customer_name=customer_name,
                party_size=int(party_size),
                reserved_at=datetime.fromisoformat(reserved_at),
                status="reserved",
            )
            table.status = "reserved"
            session.add(reservation)
            session.flush()
            return json_response({"data": {"reservation_id": reservation.reservation_id}}, 201)
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@tables_bp.post("/api/tables/merge")
@require_roles("admin", "waiter")
def merge_tables():
    try:
        payload = request.get_json(force=True)
        source_table_ids = payload.get("source_table_ids", [])
        target_table_id = payload.get("target_table_id")
        if not source_table_ids or not target_table_id:
            return json_response({"error": "source_table_ids and target_table_id are required"}, 400)
        with session_scope() as session:
            target_table = session.get(DiningTable, target_table_id)
            if not target_table:
                return json_response({"error": "Target table not found"}, 404)
            orders = session.query(Order).filter(Order.table_id.in_(source_table_ids), Order.status != "billed").all()
            for order in orders:
                order.table_id = target_table_id
            for table_id in source_table_ids:
                table = session.get(DiningTable, table_id)
                if table:
                    table.status = "occupied"
            target_table.status = "occupied"
            session.flush()
            return json_response({"data": {"merged_into": target_table_id, "moved_orders": [order.order_id for order in orders]}})
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)
