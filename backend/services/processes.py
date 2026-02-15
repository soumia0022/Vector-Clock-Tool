from flask import jsonify
from state import STATE
import state as state_mod
from services.vectors import recompute_all_vectors

def add_process() -> str:
    pid = f"P{state_mod.NEXT_PROCESS_NUM}"
    state_mod.NEXT_PROCESS_NUM += 1
    STATE["processes"].append(pid)
    recompute_all_vectors()
    return pid


def delete_process(pid: str):
    if pid not in STATE["processes"]:
        return jsonify({"ok": False, "error": f"Process {pid} not found"}), 404

    # 1) Find which dimension to remove
    deleted_index = STATE["processes"].index(pid)

    # 2) Remove the process
    STATE["processes"].remove(pid)

    # 3) Remove events of that process
    STATE["events"] = [ev for ev in STATE["events"] if ev["process"] != pid]

    # 4) Remove that dimension from ALL remaining event timestamps
    for ev in STATE["events"]:
        ts = ev["timestamp"]
        if deleted_index < len(ts):
            ev["timestamp"] = ts[:deleted_index] + ts[deleted_index + 1 :]

    # 5) Now renumber process IDs + event IDs (but DO NOT truncate timestamps anymore)
    renumber_processes_and_rewrite_events()

    return jsonify({"ok": True, "state": STATE})


def renumber_processes_and_rewrite_events() -> None:
    """
    Renumber processes to P1..Pk AND events to e1..eK.
    Also rewrites timestamps to match the new process ordering.
    """
    old_processes = STATE["processes"][:]  # e.g. ["P1","P3","P4"]
    new_processes = [f"P{i+1}" for i in range(len(old_processes))]

    pid_map = {old: new for old, new in zip(old_processes, new_processes)}

    # old_index -> new_index (same order, but explicit)
    index_map = {old_i: new_i for old_i, new_i in enumerate(range(len(old_processes)))}

    # Update processes list
    STATE["processes"] = new_processes

    # Rewrite events: process id + timestamp dimensions
    n = len(new_processes)
    for ev in STATE["events"]:
        # rename pid
        if ev["process"] in pid_map:
            ev["process"] = pid_map[ev["process"]]

        # ensure timestamp length matches new number of processes
        ts = ev["timestamp"]
        if len(ts) < n:
            ev["timestamp"] = ts + [0] * (n - len(ts))
        elif len(ts) > n:
            ev["timestamp"] = ts[:n]

    
    for idx, ev in enumerate(STATE["events"], start=1):
        ev["id"] = f"e{idx}"

    # Update counters
    state_mod.NEXT_PROCESS_NUM = len(STATE["processes"]) + 1
    state_mod.NEXT_EVENT_NUM = len(STATE["events"]) + 1
