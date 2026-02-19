from services.events import add_local_event, delete_event_node, send_message
from services.analysis import compute_happens_before
from services.processes import add_process
import pytest
from state import STATE, reset_state

def test_happens_before_local_events():
    pid1 = add_process()

    e1 = add_local_event(pid1)  # P1: [1]
    e2 = add_local_event(pid1)  # P1: [2]

    hb = compute_happens_before()

    hb_pairs = set()
    for r in hb:
        if isinstance(r, (list, tuple)) and len(r) == 2:
            hb_pairs.add((r[0], r[1]))
        elif isinstance(r, dict) and "from" in r and "to" in r:
            hb_pairs.add((r["from"], r["to"]))
        elif isinstance(r, dict) and "before" in r and "after" in r:
            hb_pairs.add((r["before"], r["after"]))

    assert (e1, e2) in hb_pairs
    assert (e2, e1) not in hb_pairs

def test_happens_before_message_send():
    pid1 = add_process()
    pid2 = add_process()

    e1 = add_local_event(pid1)  # P1: [1,0]
    e2 = add_local_event(pid2)  # P2: [0,1]

    # send_message takes PROCESS ids (not event ids)
    e3, e4 = send_message(pid1, pid2)  # P1 send: [2,0], P2 recv: [2,2]

    hb = compute_happens_before()

    hb_pairs = set()
    for r in hb:
        if isinstance(r, (list, tuple)) and len(r) == 2:
            hb_pairs.add((r[0], r[1]))
        elif isinstance(r, dict) and "from" in r and "to" in r:
            hb_pairs.add((r["from"], r["to"]))
        elif isinstance(r, dict) and "before" in r and "after" in r:
            hb_pairs.add((r["before"], r["after"]))

    # intra-process order
    assert (e1, e3) in hb_pairs
    assert (e2, e4) in hb_pairs

    # message causality + transitive closure
    assert (e3, e4) in hb_pairs
    assert (e1, e4) in hb_pairs

    assert (e2, e3) not in hb_pairs
    assert (e3, e2) not in hb_pairs

    assert (e2, e1) not in hb_pairs

    