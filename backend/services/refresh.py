from state import STATE
import state as state_mod
from services.analysis import compute_happens_before, compute_concurrent_events  

def recompute_all_event_timestamps():
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
            current_vectors[pid][i] += 1
            ev["timestamp"] = current_vectors[pid][:]

    state_mod.NEXT_EVENT_NUM = len(STATE["events"]) + 1

def renumber_events() -> None:
    for idx, ev in enumerate(STATE["events"], start=1):
        ev["id"] = f"e{idx}"
    state_mod.NEXT_EVENT_NUM = len(STATE["events"]) + 1
    
def refresh_graphs(*, renumber: bool = False) -> None:
    if renumber:
        renumber_events()
    recompute_all_event_timestamps()
    compute_happens_before()
    compute_concurrent_events()