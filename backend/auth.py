from __future__ import annotations

import os
from functools import wraps

from flask import jsonify, request


DEFAULT_ROLE = os.getenv("DEFAULT_USER_ROLE", "admin")


def current_role() -> str:
    return request.headers.get("X-User-Role", DEFAULT_ROLE).lower()


def require_roles(*allowed_roles):
    allowed = {role.lower() for role in allowed_roles}

    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            role = current_role()
            if allowed and role not in allowed:
                return jsonify({"error": "Forbidden", "role": role}), 403
            return view(*args, **kwargs)

        return wrapped

    return decorator
