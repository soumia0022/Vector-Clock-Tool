from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

STATE = {
    "processes": [],   # e.g. ["P1", "P2"]
    "events": [],      # e.g. [{"id":"e1","process":"P1","timestamp":[1,0]}]
    "messages": [],    # keep empty for this milestone
}

NEXT_PROCESS_NUM = 1
NEXT_EVENT_NUM = 1


def _new_zero_vector(n: int) -> list[int]:
    return [0] * n


def _process_index(process_id: str) -> int:
    """Return index of process in STATE['processes'] or raise ValueError."""
    try:
        return STATE["processes"].index(process_id)
    except ValueError:
        raise ValueError(f"Unknown process_id: {process_id}")


def _latest_vector_for_process(process_id: str) -> list[int]:
    """Return the latest timestamp for a process, or a zero vector if no events yet."""
    n = len(STATE["processes"])
    vec = _new_zero_vector(n)

    # Find last event of that process (by insertion order)
    for ev in reversed(STATE["events"]):
        if ev["process"] == process_id:
            vec = ev["timestamp"][:]  # copy
            break
    return vec


def _recompute_all_vectors():
    """
    When a process is added, vector length grows.
    For this milestone, we keep it simple:
    - Extend existing event timestamps with zeros to new length.
    """
    n = len(STATE["processes"])
    for ev in STATE["events"]:
        ts = ev["timestamp"]
        if len(ts) < n:
            ev["timestamp"] = ts + [0] * (n - len(ts))


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/state")
def state():
    return jsonify(STATE)


@app.post("/process")
def add_process():
    global NEXT_PROCESS_NUM
    pid = f"P{NEXT_PROCESS_NUM}"
    NEXT_PROCESS_NUM += 1

    STATE["processes"].append(pid)

    # Ensure all existing timestamps match the new vector size
    _recompute_all_vectors()

    return jsonify({"ok": True, "process_id": pid, "state": STATE})


@app.post("/event/local")
def add_local_event():
    """
    Body JSON: { "process": "P1" }
    Vector clock rule (local event at Pi): T[i] := T[i] + 1
    """
    global NEXT_EVENT_NUM

    data = request.get_json(silent=True) or {}  # sent form react if {"process" : "P1"} then pid is P1
    pid = data.get("process")
    if not pid:
        return jsonify({"ok": False, "error": "Missing 'process' in JSON body"}), 400

    try:
        i = _process_index(pid)
    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400

    vec = _latest_vector_for_process(pid)
    vec[i] += 1 #increment own index in the vector clock

    eid = f"e{NEXT_EVENT_NUM}"
    NEXT_EVENT_NUM += 1

    STATE["events"].append({
        "id": eid,
        "process": pid,
        "timestamp": vec,
        "type": "LOCAL"
    })

    return jsonify({"ok": True, "event_id": eid, "state": STATE})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
