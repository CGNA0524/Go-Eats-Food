from __future__ import annotations

from flask import Blueprint

from db import session_scope
from models import Category, MenuItem, Staff, Supplier
from routes import json_response


catalog_bp = Blueprint("catalog_bp", __name__)


@catalog_bp.get("/api/menu-items")
def menu_items():
    try:
        with session_scope() as session:
            rows = session.query(MenuItem).order_by(MenuItem.category.asc(), MenuItem.name.asc()).all()
            return json_response(
                {
                    "data": [
                        {
                            "item_id": row.item_id,
                            "name": row.name,
                            "category": row.category,
                            "price": float(row.price),
                            "is_available": bool(row.is_available),
                            "description": row.description,
                            "image_url": row.image_url,
                        }
                        for row in rows
                    ]
                }
            )
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@catalog_bp.get("/api/staff")
def staff_list():
    try:
        with session_scope() as session:
            rows = session.query(Staff).order_by(Staff.name.asc()).all()
            return json_response(
                {
                    "data": [
                        {"staff_id": row.staff_id, "name": row.name, "role": row.role, "phone": row.phone, "created_at": row.created_at.isoformat() if row.created_at else None}
                        for row in rows
                    ]
                }
            )
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@catalog_bp.get("/api/suppliers")
def supplier_list():
    try:
        with session_scope() as session:
            rows = session.query(Supplier).order_by(Supplier.name.asc()).all()
            return json_response(
                {
                    "data": [
                        {"supplier_id": row.supplier_id, "name": row.name, "contact": row.contact, "email": row.email}
                        for row in rows
                    ]
                }
            )
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@catalog_bp.get("/api/categories")
def categories_list():
    try:
        with session_scope() as session:
            rows = session.query(Category).order_by(Category.display_order.asc(), Category.name.asc()).all()
            return json_response(
                {
                    "data": [
                        {"category_id": row.category_id, "name": row.name, "display_order": row.display_order}
                        for row in rows
                    ]
                }
            )
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)
