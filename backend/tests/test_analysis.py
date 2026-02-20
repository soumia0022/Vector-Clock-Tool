from services.events import add_local_event, send_message
from services.analysis import compute_happens_before, compute_concurrent_events
from services.processes import add_process
import pytest
from state import STATE, reset_state

@pytest.fixture(autouse=True)
def reset():
    reset_state()
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

def test_compute_concurrent_events_basic():
    pid1 = add_process()
    pid2 = add_process()

    # Two independent local events on different processes => concurrent
    e1 = add_local_event(pid1)  # P1: [1,0]
    e2 = add_local_event(pid2)  # P2: [0,1]

    # Add a message later (creates causality between send/recv, but doesn't relate e1<->e2)
    e3, e4 = send_message(pid1, pid2)  # send then receive

    conc = compute_concurrent_events()

    # Normalise output to a set of (a,b) pairs (order-insensitive for concurrency checks)
    conc_pairs = set()
    for r in conc:
        if isinstance(r, (list, tuple)) and len(r) == 2:
            a, b = r
        elif isinstance(r, dict) and "a" in r and "b" in r:
            a, b = r["a"], r["b"]
        elif isinstance(r, dict) and "x" in r and "y" in r:
            a, b = r["x"], r["y"]
        elif isinstance(r, dict) and "event1" in r and "event2" in r:
            a, b = r["event1"], r["event2"]
        else:
            continue
        conc_pairs.add(tuple(sorted((a, b))))

    # Helper for assertions
    def assert_concurrent(a, b):
        assert tuple(sorted((a, b))) in conc_pairs

    def assert_not_concurrent(a, b):
        assert tuple(sorted((a, b))) not in conc_pairs

    # Concurrent pairs we expect
    assert_concurrent(e1, e2)  # independent locals
    assert_concurrent(e2, e3)  # P2 local is unrelated to P1's send event

    # Non-concurrent pairs we expect (happens-before)
    assert_not_concurrent(e1, e3)  # same process order: e1 -> e3
    assert_not_concurrent(e3, e4)  # send -> receive
    assert_not_concurrent(e2, e4)  # P2 local (before) -> receive (after) on same process
    assert_not_concurrent(e1, e4)  # transitive: e1 -> e3 -> e4
