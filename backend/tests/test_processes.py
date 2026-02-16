import pytest
from services.processes import add_process, delete_process
from services.events import add_local_event
from state import STATE, reset_state
@pytest.fixture(autouse=True)
def setup():
    reset_state()

def test_create_process():
    pid1 = add_process()
    assert pid1 == "P1"
    assert STATE["processes"] == ["P1"]
    assert all(ev["timestamp"] == [0] for ev in STATE["events"])

    pid2 = add_process()
    assert pid2 == "P2"
    assert STATE["processes"] == ["P1", "P2"]
    assert all(ev["timestamp"] == [0, 0] for ev in STATE["events"])

def test_delete_process():
    reset_state()

    pids = [add_process() for _ in range(3)]  # P1, P2, P3
    assert STATE["processes"] == ["P1", "P2", "P3"]

    for pid in pids:
        add_local_event(pid)  # 3 events total

    deleted_index = delete_process("P2")
    assert deleted_index == 1
    assert STATE["processes"] == ["P1", "P2"]  # old P3 renamed to P2

    # After deleting old P2, we should have kept events from old P1 and old P3 only => 2 events
    assert len(STATE["events"]) == 2

    # There should be exactly one event for each remaining process
    processes_in_events = sorted(ev["process"] for ev in STATE["events"])
    assert processes_in_events == ["P1", "P2"]

    # Timestamps should now have 2 dimensions
    for ev in STATE["events"]:
        assert len(ev["timestamp"]) == 2

def test_create_processes_with_events():
    pid1 = add_process()  # P1
    add_local_event(pid1)  # e1: P1 [1]

    pid2 = add_process()  # P2
    add_local_event(pid2)  # e2: P2 [0,1]   

    for ev in STATE["events"]:
        assert len(ev["timestamp"]) == 2

def test_delete_nonexistent_process():
    with pytest.raises(KeyError) as exc_info:
        delete_process("P999")  
        assert "Process P999 not found" in str(exc_info.value)