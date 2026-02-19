from flask import Blueprint, jsonify
from state import STATE
bp = Blueprint("analysis", __name__)
from services.analysis import compute_happens_before

@bp.post("/analysis/happens-before")
def compute_hb_route():
    hb = compute_happens_before()
    return jsonify({"ok": True, "hb": hb, "state": STATE})
