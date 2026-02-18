from flask import Blueprint, jsonify
from state import STATE
from services.processes import add_process, delete_process

bp = Blueprint("processes", __name__)

@bp.get("/state")
def state():
    return jsonify(STATE)

@bp.post("/process")
def create_process():
    pid = add_process()
    return jsonify({"ok": True, "process_id": pid, "state": STATE})

@bp.delete("/process/<pid>")
def remove_process(pid: str):
    try:
        delete_process(pid)
    except KeyError as e:
        return jsonify({"ok": False, "error": e.args[0]}), 404
    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 404
    return jsonify({"ok": True, "state": STATE})