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

def _renumber_processes_and_rewrite_events():
    """
    Renumber processes to P1..Pk and rewrite events accordingly.
    Also rewrites timestamps to match the new process ordering.
    """
    global NEXT_PROCESS_NUM

    old_processes = STATE["processes"][:]  # e.g. ["P1","P3","P4"]
    new_processes = [f"P{i+1}" for i in range(len(old_processes))]

    # Map old pid -> new pid
    pid_map = {old: new for old, new in zip(old_processes, new_processes)}

    # Build index map old_index -> new_index (based on new order)
    # old_index is position in old_processes; new_index is position in new_processes (same position here)
    index_map = {old_i: new_i for new_i, old_i in enumerate(range(len(old_processes)))}

    # Update processes
    STATE["processes"] = new_processes

    # Rewrite events: process id + timestamp dimensions
    for ev in STATE["events"]:
        old_pid = ev["process"]
        if old_pid in pid_map:
            ev["process"] = pid_map[old_pid]

        old_ts = ev["timestamp"]
        # old_ts length should equal len(old_processes); if not, pad/truncate safely
        if len(old_ts) < len(old_processes):
            old_ts = old_ts + [0] * (len(old_processes) - len(old_ts))
        elif len(old_ts) > len(old_processes):
            old_ts = old_ts[:len(old_processes)]

        # reorder timestamp according to index_map (currently identity, but kept for correctness)
        new_ts = [0] * len(new_processes)
        for old_i, new_i in index_map.items():
            new_ts[new_i] = old_ts[old_i]

        ev["timestamp"] = new_ts

    # Next process id should be the next integer
    NEXT_PROCESS_NUM = len(STATE["processes"]) + 1

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

@app.delete("/process/<pid>")
def delete_process(pid: str):
    if pid not in STATE["processes"]:
        return jsonify({"ok": False, "error": f"Process {pid} not found"}), 404

    # Remove the process
    STATE["processes"].remove(pid)

    # Remove events of that process
    STATE["events"] = [ev for ev in STATE["events"] if ev["process"] != pid]

    # Recompute vectors to match new process list
    _renumber_processes_and_rewrite_events()

    return jsonify({"ok": True, "state": STATE})

@app.post("/event/local/<pid>")
def add_local_event_to_pid(pid: str):
    """
    Body JSON: { "process": "P1" }  (same as /event/local but with pid in URL)
    """
    global NEXT_EVENT_NUM

    # Ensure process exists
    if pid not in STATE["processes"]:
        return jsonify({"ok": False, "error": f"Process {pid} not found"}), 400

    vec = _latest_vector_for_process(pid)
    i = _process_index(pid)
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
