from flask import jsonify


def json_response(payload=None, status_code=200):
    return jsonify(payload or {}), status_code
