from state import STATE
import state as state_mod
from services.vectors import latest_vector_for_process, process_index

def add_local_event(pid: str) -> str:
    if pid not in STATE["processes"]:
        raise ValueError(f"Process {pid} not found")

    vec = latest_vector_for_process(pid)
    i = process_index(pid)
    vec[i] += 1

    eid = f"e{state_mod.NEXT_EVENT_NUM}"
    state_mod.NEXT_EVENT_NUM += 1

    STATE["events"].append({
        "id": eid,
        "process": pid,
        "timestamp": vec,
        "type": "LOCAL"
    })
    return eid
