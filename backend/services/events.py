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

    msg_id = target.get("message_id")

    if msg_id:
        # delete BOTH send+receive (anything with same message_id)
        STATE["events"] = [ev for ev in STATE["events"] if ev.get("message_id") != msg_id]

        # optional: also remove the message record
        STATE["messages"] = [m for m in STATE["messages"] if m.get("id") != msg_id]
    else:
        # local event: delete only itself
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
    Handles LOCAL, SEND, RECEIVE.
    """
    n = len(STATE["processes"])
    current_vectors = {pid: [0] * n for pid in STATE["processes"]}

    # message_id -> send_timestamp at the point of SEND
    send_ts_by_msg: dict[str, list[int]] = {}

    for ev in STATE["events"]:
        pid = ev["process"]
        if pid not in current_vectors:
            continue

        i = STATE["processes"].index(pid)
        ev_type = ev.get("type")
        msg_id = ev.get("message_id")

        if ev_type in ("LOCAL", "SEND"):
            # local rule: increment own component
            current_vectors[pid][i] += 1
            ev["timestamp"] = current_vectors[pid][:]

            if ev_type == "SEND" and msg_id:
                send_ts_by_msg[msg_id] = ev["timestamp"][:]

        elif ev_type == "RECEIVE":
            # merge with send timestamp if we have it
            base = current_vectors[pid][:]
            if msg_id and msg_id in send_ts_by_msg:
                st = send_ts_by_msg[msg_id]
                base = [max(base[k], st[k]) for k in range(n)]

            # then increment own component
            base[i] += 1
            current_vectors[pid] = base
            ev["timestamp"] = base[:]

        else:
            # unknown type -> treat as local to avoid crashing
            current_vectors[pid][i] += 1
            ev["timestamp"] = current_vectors[pid][:]

    state_mod.NEXT_EVENT_NUM = len(STATE["events"]) + 1


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

    return send_id, recv_id