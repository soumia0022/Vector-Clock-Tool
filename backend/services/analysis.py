from state import STATE

def happens_before(ts_a: list[int], ts_b: list[int]) -> bool:
    leq_all = all(a <= b for a, b in zip(ts_a, ts_b))
    lt_some = any(a < b for a, b in zip(ts_a, ts_b))
    return leq_all and lt_some

def compute_happens_before() -> list[dict]:
    

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

def compute_concurrent_events():

    events = STATE["events"]
    concurrent_pairs: list[dict] = []

    for i in range(len(events)):
        for j in range(i + 1, len(events)):
            a = events[i]
            b = events[j]
            if not happens_before(a["timestamp"], b["timestamp"]) and not happens_before(b["timestamp"], a["timestamp"]):
                concurrent_pairs.append({"event1": a["id"], "event2": b["id"]})

    STATE["co"] = concurrent_pairs
    return concurrent_pairs