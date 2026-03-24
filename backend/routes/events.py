from flask import Blueprint, jsonify, request
from state import STATE
from services.events import add_local_event, delete_event_node, send_message
bp = Blueprint("events", __name__)

@bp.post("/event/local")
def create_local_event():
    data = request.get_json(silent=True) or {}
    pid = data.get("process")
    if not pid:
        return jsonify({"ok": False, "error": "Missing 'process' in JSON body"}), 400

    try:
        eid = add_local_event(pid)
    except KeyError as e:
        return jsonify({"ok": False, "error": e.args[0]}), 404
    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400

    return jsonify({"ok": True, "event_id": eid, "state": STATE})

@bp.post("/event/local/<pid>")
def create_local_event_for_pid(pid: str):
    try:
        eid = add_local_event(pid)
    except KeyError as e:
        return jsonify({"ok": False, "error": e.args[0]}), 404
    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    return jsonify({"ok": True, "event_id": eid, "state": STATE})

@bp.delete("/event/<event_id>")
def delete_event(event_id: str):
    try: 
        delete_event_node(event_id)
    except KeyError as e:
        return jsonify({"ok": False, "error": str(e)}), 404
    return jsonify({"ok": True, "state": STATE})
@bp.post("/event/send")

def create_send_event():
    data = request.get_json()
    from_pid = data.get("from")
    to_pid = data.get("to")

    try:
        send_id, recv_id = send_message(from_pid, to_pid)
    except KeyError as e:
        return jsonify({"ok": False, "error": e.args[0]}), 404

    return jsonify({
        "ok": True,
        "send_event": send_id,
        "receive_event": recv_id,
        "state": STATE
    })
