from __future__ import annotations

import jwt
from datetime import datetime, timedelta
from functools import wraps

from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

try:
    from ..db import session_scope
    from ..models import User
except ImportError:
    from db import session_scope
    from models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# Secret key for JWT - in production, use environment variable
JWT_SECRET = "goeats-food-secret-key-change-in-production"
JWT_EXPIRY_HOURS = 24


def generate_token(user):
    """Generate JWT token for user."""
    payload = {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token


def verify_token(token):
    """Verify JWT token and return payload."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def require_auth(f):
    """Decorator to require authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid authorization header"}), 401

        token = auth_header[7:]  # Remove "Bearer " prefix
        payload = verify_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Store user info in request context
        request.user = payload
        return f(*args, **kwargs)

    return decorated_function


@auth_bp.post("/signup")
def signup():
    """Create a new user account."""
    data = request.get_json() or {}

    # Validate required fields
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    name = data.get("name", "").strip()

    if not email or not password or not name:
        return (
            jsonify({"error": "Email, password, and name are required"}),
            400,
        )

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    with session_scope() as session:
        # Check if email already exists
        existing_user = session.query(User).filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "Email already registered"}), 409

        # Create new user
        password_hash = generate_password_hash(password)
        user = User(
            email=email,
            password_hash=password_hash,
            name=name,
            role="admin",  # New users default to admin
        )
        session.add(user)
        session.commit()

        token = generate_token(user)
        return (
            jsonify(
                {
                    "message": "Account created successfully",
                    "token": token,
                    "user": {
                        "user_id": user.user_id,
                        "email": user.email,
                        "name": user.name,
                        "role": user.role,
                    },
                }
            ),
            201,
        )


@auth_bp.post("/login")
def login():
    """Authenticate user and return JWT token."""
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    with session_scope() as session:
        user = session.query(User).filter_by(email=email).first()

        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid email or password"}), 401

        if not user.is_active:
            return jsonify({"error": "Account is inactive"}), 403

        token = generate_token(user)
        return (
            jsonify(
                {
                    "message": "Login successful",
                    "token": token,
                    "user": {
                        "user_id": user.user_id,
                        "email": user.email,
                        "name": user.name,
                        "role": user.role,
                    },
                }
            ),
            200,
        )


@auth_bp.get("/me")
@require_auth
def get_profile():
    """Get current user profile."""
    user_data = request.user
    with session_scope() as session:
        user = session.query(User).filter_by(user_id=user_data["user_id"]).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        return (
            jsonify(
                {
                    "user": {
                        "user_id": user.user_id,
                        "email": user.email,
                        "name": user.name,
                        "role": user.role,
                        "is_active": user.is_active,
                        "created_at": user.created_at.isoformat(),
                    }
                }
            ),
            200,
        )


@auth_bp.put("/profile")
@require_auth
def update_profile():
    """Update current user profile."""
    data = request.get_json() or {}
    user_data = request.user

    name = data.get("name", "").strip()
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if not name:
        return jsonify({"error": "Name is required"}), 400

    with session_scope() as session:
        user = session.query(User).filter_by(user_id=user_data["user_id"]).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Update name
        user.name = name

        # If changing password, verify current password first
        if new_password:
            if not current_password:
                return jsonify({"error": "Current password required to change password"}), 400
            if not check_password_hash(user.password_hash, current_password):
                return jsonify({"error": "Current password is incorrect"}), 401
            if len(new_password) < 6:
                return jsonify({"error": "New password must be at least 6 characters"}), 400

            user.password_hash = generate_password_hash(new_password)

        session.commit()

        return (
            jsonify(
                {
                    "message": "Profile updated successfully",
                    "user": {
                        "user_id": user.user_id,
                        "email": user.email,
                        "name": user.name,
                        "role": user.role,
                    },
                }
            ),
            200,
        )


@auth_bp.post("/logout")
@require_auth
def logout():
    """Logout user (token invalidation handled client-side)."""
    return jsonify({"message": "Logged out successfully"}), 200


@auth_bp.post("/verify-token")
def verify_token_endpoint():
    """Verify if a token is valid."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"valid": False, "error": "Missing authorization header"}), 400

    token = auth_header[7:]
    payload = verify_token(token)

    if not payload:
        return jsonify({"valid": False, "error": "Invalid or expired token"}), 401

    return jsonify({"valid": True, "user": payload}), 200
