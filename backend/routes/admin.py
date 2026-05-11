from __future__ import annotations

from flask import Blueprint, request

from auth import require_roles
try:
    from ..db import session_scope
    from ..models import Category, MenuItem, Staff, Supplier
except ImportError:
    from db import session_scope
    from models import Category, MenuItem, Staff, Supplier
from routes import json_response


admin_bp = Blueprint("admin_bp", __name__)


@admin_bp.post("/api/admin/menu-items")
@require_roles("admin")
def create_menu_item():
    try:
        payload = request.get_json(force=True)
        with session_scope() as session:
            row = MenuItem(**payload)
            session.add(row)
            session.flush()
            return json_response({"data": {"item_id": row.item_id}}, 201)
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@admin_bp.put("/api/admin/menu-items/<int:item_id>")
@require_roles("admin")
def update_menu_item(item_id):
    try:
        payload = request.get_json(force=True)
        with session_scope() as session:
            row = session.get(MenuItem, item_id)
            if not row:
                return json_response({"error": "Menu item not found"}, 404)
            for key, value in payload.items():
                if hasattr(row, key):
                    setattr(row, key, value)
            session.flush()
            return json_response({"data": {"item_id": row.item_id}})
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@admin_bp.post("/api/admin/staff")
@require_roles("admin")
def create_staff():
    try:
        payload = request.get_json(force=True)
        with session_scope() as session:
            row = Staff(**payload)
            session.add(row)
            session.flush()
            return json_response({"data": {"staff_id": row.staff_id}}, 201)
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@admin_bp.put("/api/admin/staff/<int:staff_id>")
@require_roles("admin")
def update_staff(staff_id):
    try:
        payload = request.get_json(force=True)
        with session_scope() as session:
            row = session.get(Staff, staff_id)
            if not row:
                return json_response({"error": "Staff not found"}, 404)
            for key, value in payload.items():
                if hasattr(row, key):
                    setattr(row, key, value)
            session.flush()
            return json_response({"data": {"staff_id": row.staff_id}})
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@admin_bp.post("/api/admin/suppliers")
@require_roles("admin")
def create_supplier():
    try:
        payload = request.get_json(force=True)
        with session_scope() as session:
            row = Supplier(**payload)
            session.add(row)
            session.flush()
            return json_response({"data": {"supplier_id": row.supplier_id}}, 201)
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)


@admin_bp.put("/api/admin/suppliers/<int:supplier_id>")
@require_roles("admin")
def update_supplier(supplier_id):
    try:
        payload = request.get_json(force=True)
        with session_scope() as session:
            row = session.get(Supplier, supplier_id)
            if not row:
                return json_response({"error": "Supplier not found"}, 404)
            for key, value in payload.items():
                if hasattr(row, key):
                    setattr(row, key, value)
            session.flush()
            return json_response({"data": {"supplier_id": row.supplier_id}})
    except Exception as exc:
        return json_response({"error": str(exc)}, 500)
