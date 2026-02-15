from flask import Blueprint, jsonify, request
from state import STATE
from services.events import add_local_event

bp = Blueprint("events", __name__)

@bp.post("/event/local")
def create_local_event():
    data = request.get_json(silent=True) or {}
    pid = data.get("process")
    if not pid:
        return jsonify({"ok": False, "error": "Missing 'process' in JSON body"}), 400

    try:
        eid = add_local_event(pid)
    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400

    return jsonify({"ok": True, "event_id": eid, "state": STATE})

@bp.post("/event/local/<pid>")
def create_local_event_for_pid(pid: str):
    try:
        eid = add_local_event(pid)
    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    return jsonify({"ok": True, "event_id": eid, "state": STATE})