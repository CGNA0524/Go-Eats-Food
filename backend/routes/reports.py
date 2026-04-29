from __future__ import annotations

from datetime import datetime, timedelta

from flask import Blueprint, request
from sqlalchemy import extract, func

from db import session_scope
from models import Bill, MenuItem, Order, OrderItem
from routes import json_response


reports_bp = Blueprint("reports_bp", __name__)


def _parse_date(value):
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


@reports_bp.get("/api/reports/daily")
def daily_report():
    try:
        start = _parse_date(request.args.get("start")) or datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        end = _parse_date(request.args.get("end")) or datetime.utcnow()
        with session_scope() as session:
            rows = (
                session.query(
                    func.date(Bill.billed_at).label("day"),
                    func.sum(Bill.total).label("revenue"),
                    func.count(Bill.bill_id).label("bill_count"),
                )
                .filter(Bill.billed_at >= start, Bill.billed_at <= end)
                .group_by(func.date(Bill.billed_at))
                .order_by(func.date(Bill.billed_at))
                .all()
            )
            summary = session.query(
                func.coalesce(func.sum(Bill.total), 0),
                func.coalesce(func.count(Bill.bill_id), 0),
                func.coalesce(func.avg(Bill.total), 0),
            ).filter(Bill.billed_at >= start, Bill.billed_at <= end).one()
            return json_response(
                {
                    "data": [
                        {"day": str(row.day), "revenue": float(row.revenue or 0), "bill_count": int(row.bill_count or 0)}
                        for row in rows
                    ],
                    "summary": {
                        "revenue": float(summary[0] or 0),
                        "bill_count": int(summary[1] or 0),
                        "avg_order_value": float(summary[2] or 0),
                    },
                }
            )
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@reports_bp.get("/api/reports/weekly")
def weekly_report():
    try:
        today = datetime.utcnow().date()
        start = today - timedelta(days=6)
        with session_scope() as session:
            rows = (
                session.query(func.date(Bill.billed_at).label("day"), func.sum(Bill.total).label("revenue"))
                .filter(Bill.billed_at >= datetime.combine(start, datetime.min.time()), Bill.billed_at <= datetime.utcnow())
                .group_by(func.date(Bill.billed_at))
                .order_by(func.date(Bill.billed_at))
                .all()
            )
            day_map = {str(row.day): float(row.revenue or 0) for row in rows}
            payload = []
            for offset in range(7):
                current = start + timedelta(days=offset)
                payload.append({"day": current.isoformat(), "revenue": day_map.get(current.isoformat(), 0.0)})
            return json_response({"data": payload})
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@reports_bp.get("/api/reports/top-items")
def top_items_report():
    try:
        with session_scope() as session:
            rows = (
                session.query(
                    MenuItem.item_id,
                    MenuItem.name,
                    MenuItem.category,
                    func.count(OrderItem.order_item_id).label("order_count"),
                    func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0).label("weekly_revenue"),
                )
                .join(OrderItem, OrderItem.item_id == MenuItem.item_id)
                .join(Order, Order.order_id == OrderItem.order_id)
                .join(Bill, Bill.order_id == Order.order_id)
                .filter(Bill.billed_at >= datetime.utcnow() - timedelta(days=7))
                .group_by(MenuItem.item_id, MenuItem.name, MenuItem.category)
                .order_by(func.count(OrderItem.order_item_id).desc())
                .limit(5)
                .all()
            )
            return json_response(
                {
                    "data": [
                        {
                            "item_id": row.item_id,
                            "name": row.name,
                            "category": row.category,
                            "order_count": int(row.order_count or 0),
                            "weekly_revenue": float(row.weekly_revenue or 0),
                            "trend": 0,
                        }
                        for row in rows
                    ]
                }
            )
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@reports_bp.get("/api/reports/hourly")
def hourly_report():
    try:
        with session_scope() as session:
            rows = (
                session.query(extract("hour", Bill.billed_at).label("hour"), func.sum(Bill.total).label("revenue"))
                .group_by(extract("hour", Bill.billed_at))
                .order_by(extract("hour", Bill.billed_at))
                .all()
            )
            payload = [{"hour": int(row.hour), "revenue": float(row.revenue or 0)} for row in rows]
            return json_response({"data": payload})
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@reports_bp.get("/api/reports/category-breakdown")
def category_breakdown():
    try:
        with session_scope() as session:
            rows = (
                session.query(
                    MenuItem.category,
                    func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0).label("revenue"),
                )
                .join(OrderItem, OrderItem.item_id == MenuItem.item_id)
                .join(Order, Order.order_id == OrderItem.order_id)
                .join(Bill, Bill.order_id == Order.order_id)
                .filter(Bill.billed_at >= datetime.utcnow() - timedelta(days=7))
                .group_by(MenuItem.category)
                .order_by(func.sum(OrderItem.quantity * OrderItem.unit_price).desc())
                .all()
            )
            total = sum(float(row.revenue or 0) for row in rows) or 1.0
            return json_response(
                {
                    "data": [
                        {
                            "category": row.category,
                            "revenue": float(row.revenue or 0),
                            "percent": round((float(row.revenue or 0) / total) * 100, 2),
                        }
                        for row in rows
                    ]
                }
            )
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)
