from flask import Blueprint, jsonify, request
from services.vectors import recompute_all_event_timestamps
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

@bp.delete("/event/<event_id>")
def delete_event(event_id: str):
    import state as state_mod
    # find event
    target = next((ev for ev in STATE["events"] if ev["id"] == event_id), None)
    if not target:
        return jsonify({"ok": False, "error": f"Event {event_id} not found"}), 404

    # remove event
    STATE["events"] = [ev for ev in STATE["events"] if ev["id"] != event_id]

    # renumber remaining events e1..eK
    for idx, ev in enumerate(STATE["events"], start=1):
        ev["id"] = f"e{idx}"
    
    recompute_all_event_timestamps()

    state_mod.NEXT_EVENT_NUM = len(STATE["events"]) + 1

    return jsonify({"ok": True, "state": STATE})
