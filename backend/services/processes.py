from state import STATE
import state as state_mod
from services.vectors import recompute_all_vectors

def add_process() -> str:
    pid = f"P{state_mod.NEXT_PROCESS_NUM}"
    state_mod.NEXT_PROCESS_NUM += 1
    STATE["processes"].append(pid)
    recompute_all_vectors()
    return pid


def delete_process(pid: str) -> None:
    if pid not in STATE["processes"]:
        raise ValueError(f"Process {pid} not found")

    STATE["processes"].remove(pid)
    STATE["events"] = [ev for ev in STATE["events"] if ev["process"] != pid]

    renumber_processes_and_rewrite_events()


def renumber_processes_and_rewrite_events() -> None:
    """
    Renumber processes to P1..Pk and rewrite events accordingly.
    Also rewrites timestamps to match the new process ordering.
    """
    old_processes = STATE["processes"][:]  # e.g. ["P1","P3","P4"]
    new_processes = [f"P{i+1}" for i in range(len(old_processes))]

    pid_map = {old: new for old, new in zip(old_processes, new_processes)}

    # old_index -> new_index (same order, but explicit)
    index_map = {old_i: new_i for old_i, new_i in enumerate(range(len(old_processes)))}

    STATE["processes"] = new_processes

    for ev in STATE["events"]:
        # rename process id
        old_pid = ev["process"]
        if old_pid in pid_map:
            ev["process"] = pid_map[old_pid]

        # rewrite timestamp to new dimension ordering/length
        old_ts = ev["timestamp"]
        if len(old_ts) < len(old_processes):
            old_ts = old_ts + [0] * (len(old_processes) - len(old_ts))
        elif len(old_ts) > len(old_processes):
            old_ts = old_ts[:len(old_processes)]

        new_ts = [0] * len(new_processes)
        for old_i, new_i in index_map.items():
            new_ts[new_i] = old_ts[old_i]
        ev["timestamp"] = new_ts

    # update the counter so new process continues after Pk
    state_mod.NEXT_PROCESS_NUM = len(STATE["processes"]) + 1