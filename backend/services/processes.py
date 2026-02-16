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


def renumber_processes_and_rewrite_event_process_fields() -> None:
    """
    Renumber processes to P1..Pk and rewrite event.process fields to match.
    Does NOT renumber events.
    Does NOT recompute vector clock values (only adjusts dimensions/ids).
    """
    old_processes = STATE["processes"][:]        # after deletion, e.g. ["P1","P2","P4"]
    new_processes = [f"P{i+1}" for i in range(len(old_processes))]  # ["P1","P2","P3"]
    pid_map = dict(zip(old_processes, new_processes))

    STATE["processes"] = new_processes

    # update event.process values
    for ev in STATE["events"]:
        if ev["process"] in pid_map:
            ev["process"] = pid_map[ev["process"]]

        # ensure timestamps length equals number of processes
        n = len(new_processes)
        ts = ev["timestamp"]
        if len(ts) < n:
            ev["timestamp"] = ts + [0] * (n - len(ts))
        elif len(ts) > n:
            ev["timestamp"] = ts[:n]

    state_mod.NEXT_PROCESS_NUM = len(STATE["processes"]) + 1
