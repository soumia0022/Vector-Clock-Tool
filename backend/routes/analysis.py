from flask import Blueprint, jsonify
from state import STATE
bp = Blueprint("analysis", __name__)
from services.analysis import compute_happens_before, compute_concurrent_events

@bp.post("/analysis/happens-before")
def compute_hb_route():
    hb = compute_happens_before()
    return jsonify({"ok": True, "hb": hb, "state": STATE})

@bp.post("/analysis/concurrent")
def compute_concurrent_route():
    concurrent = compute_concurrent_events()
    return jsonify({"ok": True, "concurrent": concurrent, "state": STATE})
