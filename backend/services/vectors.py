from state import STATE

def new_zero_vector(n: int) -> list[int]:
    return [0] * n


def process_index(process_id: str) -> int:
    try:
        return STATE["processes"].index(process_id)
    except ValueError:
        raise ValueError(f"Unknown process_id: {process_id}")


def latest_vector_for_process(process_id: str) -> list[int]:
    n = len(STATE["processes"])
    vec = new_zero_vector(n)

    for ev in reversed(STATE["events"]):
        if ev["process"] == process_id:
            vec = ev["timestamp"][:]  # copy
            break
    return vec


def recompute_all_vectors():
    """
    Ensure all event timestamps have the right length after process list changes.
    For now: extend with zeros (simple milestone behaviour).
    """
    n = len(STATE["processes"])
    for ev in STATE["events"]:
        ts = ev["timestamp"]
        if len(ts) < n:
            ev["timestamp"] = ts + [0] * (n - len(ts))
        elif len(ts) > n:
            ev["timestamp"] = ts[:n]
