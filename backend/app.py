from __future__ import annotations

import os

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

try:
    # For gunicorn module loading (backend.app:app)
    from .bootstrap import seed_if_empty
    from .db import Base, DATABASE_URL, engine, session_scope
    from .routes.admin import admin_bp
    from .routes.auth import auth_bp
    from .routes.catalog import catalog_bp
    from .routes.billing import billing_bp
    from .routes.inventory import inventory_bp
    from .routes.orders import orders_bp
    from .routes.reports import reports_bp
    from .routes.tables import tables_bp
except ImportError:
    # For direct script execution
    from bootstrap import seed_if_empty
    from db import Base, DATABASE_URL, engine, session_scope
    from routes.admin import admin_bp
    from routes.auth import auth_bp
    from routes.catalog import catalog_bp
    from routes.billing import billing_bp
    from routes.inventory import inventory_bp
    from routes.orders import orders_bp
    from routes.reports import reports_bp
    from routes.tables import tables_bp


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")


def create_app():
    app = Flask(__name__)
    app.config["JSON_SORT_KEYS"] = False
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(orders_bp)
    app.register_blueprint(billing_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(tables_bp)
    app.register_blueprint(catalog_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(auth_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "Go Eats Food API"})

    @app.after_request
    def add_headers(response):
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/")
    def index():
        return send_from_directory(FRONTEND_DIR, "login.html")

    @app.get("/dashboard.html")
    def dashboard():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.get("/<path:filename>")
    def frontend_files(filename):
        return send_from_directory(FRONTEND_DIR, filename)

    if DATABASE_URL.startswith("sqlite") or os.getenv("AUTO_CREATE_TABLES", "0") == "1":
        Base.metadata.create_all(bind=engine)
        with session_scope() as session:
            seed_if_empty(session)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
