from state import STATE
from services.events import recompute_all_event_timestamps

def happens_before(ts_a: list[int], ts_b: list[int]) -> bool:
    leq_all = all(a <= b for a, b in zip(ts_a, ts_b))
    lt_some = any(a < b for a, b in zip(ts_a, ts_b))
    return leq_all and lt_some

def compute_happens_before() -> list[dict]:
    # ensure timestamps are correct before computing HB
    recompute_all_event_timestamps()

    events = STATE["events"]
    hb_edges: list[dict] = []

    for i in range(len(events)):
        for j in range(len(events)):
            if i == j:
                continue
            a = events[i]
            b = events[j]
            if happens_before(a["timestamp"], b["timestamp"]):
                hb_edges.append({"from": a["id"], "to": b["id"]})

    STATE["hb"] = hb_edges
    return hb_edges
