from state import STATE
import state as state_mod
from services.vectors import latest_vector_for_process, process_index
from services.refresh import refresh_graphs


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
    refresh_graphs(renumber=True)
    return eid


def delete_event_node(event_id: str) -> None:
    target = next((ev for ev in STATE["events"] if ev["id"] == event_id), None)
    if not target:
        raise KeyError(f"Event {event_id} not found")

    msg_id = target.get("message_id")

    if msg_id:
        # delete both send+receive (anything with same message_id)
        STATE["events"] = [ev for ev in STATE["events"] if ev.get("message_id") != msg_id]

        # also remove the message record
        STATE["messages"] = [m for m in STATE["messages"] if m.get("id") != msg_id]
    else:
        # local event: delete only itself
        STATE["events"] = [ev for ev in STATE["events"] if ev["id"] != event_id]

    refresh_graphs(renumber=True)












def send_message(from_pid: str, to_pid: str) -> tuple[str, str]:
    if from_pid not in STATE["processes"]:
        raise KeyError(f"Process {from_pid} not found")
    if to_pid not in STATE["processes"]:
        raise KeyError(f"Process {to_pid} not found")

    # stable link between the pair
    msg_id = f"m{len(STATE['messages']) + 1}"
    STATE["messages"].append({
        "id": msg_id,
        "from": from_pid,
        "to": to_pid,
    })

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
        "type": "SEND",
        "message_id": msg_id,
    })

    # --- RECEIVE EVENT ---
    recv_vec = latest_vector_for_process(to_pid)
    j = process_index(to_pid)

    recv_vec = [max(recv_vec[k], send_vec[k]) for k in range(n)]
    recv_vec[j] += 1

    recv_id = f"e{state_mod.NEXT_EVENT_NUM}"
    state_mod.NEXT_EVENT_NUM += 1

    STATE["events"].append({
        "id": recv_id,
        "process": to_pid,
        "timestamp": recv_vec,
        "type": "RECEIVE",
        "message_id": msg_id,
    })

    refresh_graphs(renumber=True)

    return send_id, recv_id