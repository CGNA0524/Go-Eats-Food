from __future__ import annotations

from flask import Blueprint, request

from auth import require_roles
try:
    from ..db import session_scope
    from ..models import Bill, DiningTable, Order, Staff
except ImportError:
    from db import session_scope
    from models import Bill, DiningTable, Order, Staff
from routes import json_response
from services import calculate_bill_breakdown


billing_bp = Blueprint("billing_bp", __name__)


def _receipt_payload(order, bill):
    return {
        "restaurant": {
            "name": "Go Eats Food",
            "address": "Modern Dining Street, City Center",
        },
        "order_id": order.order_id,
        "table_id": order.table_id,
        "date_time": bill.billed_at.isoformat() if bill.billed_at else None,
        "payment_mode": bill.payment_mode,
        "items": [
            {
                "name": item.menu_item.name if item.menu_item else None,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "line_total": float(item.unit_price) * item.quantity,
            }
            for item in order.order_items
        ],
        "subtotal": float(bill.subtotal),
        "tax_amount": float(bill.tax_amount),
        "service_charge": float(bill.service_charge),
        "total": float(bill.total),
        "footer": "Thank you for dining with Go Eats Food. Enjoy your next visit coupon.",
    }


@billing_bp.post("/api/bills")
@require_roles("admin", "cashier")
def create_bill():
    try:
        payload = request.get_json(force=True)
        order_id = payload.get("order_id")
        payment_mode = payload.get("payment_mode")
        staff_id = payload.get("staff_id")
        if not order_id or not payment_mode or not staff_id:
            return json_response({"error": "order_id, payment_mode and staff_id are required"}, 400)

        with session_scope() as session:
            order = session.get(Order, order_id)
            staff = session.get(Staff, staff_id)
            if not order or not staff:
                return json_response({"error": "Order or staff not found"}, 404)
            if order.bill:
                bill = order.bill
                return json_response({"data": {"bill_id": bill.bill_id, "receipt": _receipt_payload(order, bill)}})

            breakdown = calculate_bill_breakdown(order)
            bill = Bill(
                order_id=order.order_id,
                subtotal=breakdown["subtotal"],
                tax_amount=breakdown["tax_amount"],
                service_charge=breakdown["service_charge"],
                total=breakdown["total"],
                payment_mode=payment_mode,
                staff_id=staff_id,
            )
            order.status = "billed"
            table = session.get(DiningTable, order.table_id)
            if table:
                table.status = "available"
            session.add(bill)
            session.flush()
            session.refresh(bill)
            return json_response({"data": {"bill_id": bill.bill_id, "receipt": _receipt_payload(order, bill)}}, 201)
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@billing_bp.get("/api/bills/<int:bill_id>")
def get_bill(bill_id):
    try:
        with session_scope() as session:
            bill = session.get(Bill, bill_id)
            if not bill:
                return json_response({"error": "Bill not found"}, 404)
            return json_response(
                {
                    "data": {
                        "bill_id": bill.bill_id,
                        "order_id": bill.order_id,
                        "subtotal": float(bill.subtotal),
                        "tax_amount": float(bill.tax_amount),
                        "service_charge": float(bill.service_charge),
                        "total": float(bill.total),
                        "payment_mode": bill.payment_mode,
                        "billed_at": bill.billed_at.isoformat() if bill.billed_at else None,
                    }
                }
            )
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@billing_bp.get("/api/bills")
def list_bills():
    try:
        limit = request.args.get("limit", default=10, type=int)
        with session_scope() as session:
            rows = (
                session.query(Bill, Order, DiningTable)
                .join(Order, Order.order_id == Bill.order_id)
                .join(DiningTable, DiningTable.table_id == Order.table_id)
                .order_by(Bill.billed_at.desc())
                .limit(limit)
                .all()
            )
            return json_response(
                {
                    "data": [
                        {
                            "bill_id": bill.bill_id,
                            "order_id": bill.order_id,
                            "table_id": order.table_id,
                            "total": float(bill.total),
                            "payment_mode": bill.payment_mode,
                            "billed_at": bill.billed_at.isoformat() if bill.billed_at else None,
                            "staff_id": bill.staff_id,
                            "table_status": table.status,
                        }
                        for bill, order, table in rows
                    ]
                }
            )
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)
