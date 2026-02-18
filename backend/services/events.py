from state import STATE
import state as state_mod
from services.vectors import latest_vector_for_process, process_index

def add_local_event(pid: str) -> str:
    if pid not in STATE["processes"]:
        raise KeyError(f"Process {pid} not found")

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


def delete_event_node(event_id: str) -> None:
    target = next((ev for ev in STATE["events"] if ev["id"] == event_id), None)
    if not target:
        raise KeyError(f"Event {event_id} not found")

    STATE["events"] = [ev for ev in STATE["events"] if ev["id"] != event_id]
    renumber_events()
    recompute_all_event_timestamps()


def renumber_events() -> None:
    for idx, ev in enumerate(STATE["events"], start=1):
        ev["id"] = f"e{idx}"
    state_mod.NEXT_EVENT_NUM = len(STATE["events"]) + 1




def recompute_all_event_timestamps():
    """
    Recompute all vector timestamps from scratch
    based on current process list and current event ordering.
    Assumes only LOCAL events for now.
    """

    n = len(STATE["processes"])

    # current vector state per process
    current_vectors = {
        pid: [0] * n for pid in STATE["processes"]
    }

    for ev in STATE["events"]:
        pid = ev["process"]
        if pid not in current_vectors:
            continue

        i = STATE["processes"].index(pid)

        # LOCAL event rule: increment own component
        current_vectors[pid][i] += 1

        ev["timestamp"] = current_vectors[pid][:]

    state_mod.NEXT_EVENT_NUM = len(STATE["events"]) + 1


def send_message(from_pid: str, to_pid: str) -> tuple[str, str]:
    if from_pid not in STATE["processes"]:
        raise KeyError(f"Process {from_pid} not found")
    if to_pid not in STATE["processes"]:
        raise KeyError(f"Process {to_pid} not found")

    n = len(STATE["processes"])

    # --- SEND EVENT ---
    send_vec = latest_vector_for_process(from_pid)
    i = process_index(from_pid)
    send_vec[i] += 1

    send_id = f"e{state_mod.NEXT_EVENT_NUM}"
    state_mod.NEXT_EVENT_NUM += 1

    STATE["events"].append({
        "id": send_id,
        "process": from_pid,
        "timestamp": send_vec,
        "type": "SEND"
    })

    # --- RECEIVE EVENT ---
    recv_vec = latest_vector_for_process(to_pid)
    j = process_index(to_pid)

    # element-wise max
    recv_vec = [
        max(recv_vec[k], send_vec[k])
        for k in range(n)
    ]

    recv_vec[j] += 1

    recv_id = f"e{state_mod.NEXT_EVENT_NUM}"
    state_mod.NEXT_EVENT_NUM += 1

    STATE["events"].append({
        "id": recv_id,
        "process": to_pid,
        "timestamp": recv_vec,
        "type": "RECEIVE"
    })

    return send_id, recv_id
