from state import STATE
import state as state_mod

def add_process() -> str:
    pid = f"P{state_mod.NEXT_PROCESS_NUM}"
    state_mod.NEXT_PROCESS_NUM += 1
    STATE["processes"].append(pid)

    # when new process added, extend existing timestamps with 0
    n = len(STATE["processes"])
    for ev in STATE["events"]:
        ts = ev["timestamp"]
        if len(ts) < n:
            ev["timestamp"] = ts + [0] * (n - len(ts))

    return pid


def delete_process(pid: str) -> int:
    """
    Deletes a process and updates timestamps by removing the deleted dimension.
    Returns deleted_index (the removed dimension index) for debugging/logging if needed.
    """
    if pid not in STATE["processes"]:
        raise KeyError(f"Process {pid} not found")

    deleted_index = STATE["processes"].index(pid)

    # remove process
    STATE["processes"].remove(pid)

    # drop events belonging to that process
    STATE["events"] = [ev for ev in STATE["events"] if ev["process"] != pid]

    # remove the deleted dimension from ALL remaining timestamps
    for ev in STATE["events"]:
        ts = ev["timestamp"]
        if deleted_index < len(ts):
            ev["timestamp"] = ts[:deleted_index] + ts[deleted_index + 1:]

    # renumber processes and rewrite event.process names accordingly
    renumber_processes_and_rewrite_event_process_fields()

    return deleted_index


def build_process_renaming_map() -> dict[str, str]:
    """
    Returns mapping old_pid -> new_pid based on current STATE['processes'] order.
    Example: ["P1","P4"] -> {"P1":"P1", "P4":"P2"}
    """
    old_processes = STATE["processes"][:]
    new_processes = [f"P{i+1}" for i in range(len(old_processes))]
    return dict(zip(old_processes, new_processes))


def apply_process_renaming(pid_map: dict[str, str]) -> None:
    """Renames STATE['processes'] using pid_map."""
    STATE["processes"] = [pid_map[pid] for pid in STATE["processes"]]


def rewrite_event_process_fields(pid_map: dict[str, str]) -> None:
    """Renames ev['process'] for every event using pid_map."""
    for ev in STATE["events"]:
        if ev["process"] in pid_map:
            ev["process"] = pid_map[ev["process"]]


def ensure_event_timestamp_lengths() -> None:
    """
    Ensures every ev['timestamp'] length matches len(STATE['processes']).
    Only pads/truncates length — does NOT recompute values.
    """
    n = len(STATE["processes"])
    for ev in STATE["events"]:
        ts = ev["timestamp"]
        if len(ts) < n:
            ev["timestamp"] = ts + [0] * (n - len(ts))
        elif len(ts) > n:
            ev["timestamp"] = ts[:n]


def update_process_counter() -> None:
    state_mod.NEXT_PROCESS_NUM = len(STATE["processes"]) + 1


def renumber_processes_and_rewrite_event_process_fields() -> None:
    """
    Orchestrator: renumber processes and update event.process fields + timestamp length.
    """
    pid_map = build_process_renaming_map()
    apply_process_renaming(pid_map)
    rewrite_event_process_fields(pid_map)
    ensure_event_timestamp_lengths()
    update_process_counter()
