from state import STATE
import state as state_mod
from services.refresh import refresh_graphs

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
    refresh_graphs(renumber=False)

    return pid


def delete_process(pid: str) -> int:
    if pid not in STATE["processes"]:
        raise KeyError(f"Process {pid} not found")

    deleted_index = STATE["processes"].index(pid)

    # 1) find messages involving this process (BEFORE removing it / renaming)
    removed_msg_ids = {
        m["id"] for m in STATE["messages"]
        if m.get("from") == pid or m.get("to") == pid
    }

    # 2) remove process
    STATE["processes"].remove(pid)

    # 3) drop events belonging to that process OR linked to removed messages
    STATE["events"] = [
        ev for ev in STATE["events"]
        if ev.get("process") != pid and ev.get("message_id") not in removed_msg_ids
    ]

    # 4) remove those messages
    STATE["messages"] = [
        m for m in STATE["messages"]
        if m.get("from") != pid and m.get("to") != pid
    ]

    # 5) remove the deleted dimension from the remaining timestamps
    for ev in STATE["events"]:
        ts = ev["timestamp"]
        if deleted_index < len(ts):
            ev["timestamp"] = ts[:deleted_index] + ts[deleted_index + 1:]

    # 6) renumber processes and rewrite event.process + message endpoints
    renumber_processes_and_rewrite_event_process_fields()
    refresh_graphs(renumber=False) 

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

def rewrite_message_endpoints(pid_map: dict[str, str]) -> None:
    """Renames message 'from'/'to' using pid_map."""
    for m in STATE["messages"]:
        if m.get("from") in pid_map:
            m["from"] = pid_map[m["from"]]
        if m.get("to") in pid_map:
            m["to"] = pid_map[m["to"]]


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
    rewrite_message_endpoints(pid_map) 
    ensure_event_timestamp_lengths()
    update_process_counter()
