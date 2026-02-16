from services.events import add_local_event, delete_event_node
from services.processes import add_process
import pytest
from state import STATE

def test_create_local_events():
    # create processes P1, P2
    pid1 = add_process()
    pid2 = add_process()

    # create events for P1 and P2
    eid1 = add_local_event(pid1)
    eid2 = add_local_event(pid2)

    # check events created with correct process and timestamp
    ev1 = next(ev for ev in STATE["events"] if ev["id"] == eid1)
    ev2 = next(ev for ev in STATE["events"] if ev["id"] == eid2)
    assert ev1["process"] == pid1
    assert ev2["process"] == pid2
    assert ev1["timestamp"] == [1, 0]
    assert ev2["timestamp"] == [0, 1]

def test_add_local_event_with_wrong_pid():
    STATE["processes"].clear()
    STATE["events"].clear()

    with pytest.raises(KeyError) as excinfo:
        add_local_event("P999")

    assert excinfo.value.args[0] == "Process P999 not found"

def test_delete_event_node():
    # create processes and events
    pid1 = add_process()
    pid2 = add_process()
    eid1 = add_local_event(pid1)
    eid2 = add_local_event(pid2)
    eid3 = add_local_event(pid1)  # another event for pid1 to check timestamp recompute

    # delete event eid1
    delete_event_node(eid1)

    # check event is deleted and remaining event is renumbered
    assert all(ev["id"] != eid1 for ev in STATE["events"])
    assert any(ev["id"] == "e1" for ev in STATE["events"])  # eid2 should be renumbered to e1

    #check timestamps are recomputed correctly after deletion
    ev1 = next(ev for ev in STATE["events"] if ev["id"] == "e1")
    ev2 = next(ev for ev in STATE["events"] if ev["id"] == "e2")
    assert ev1["timestamp"] == [0, 1]  # originally eid2
    assert ev2["timestamp"] == [1, 0]  # originally eid3  

def test_delete_nonexistent_event():
    STATE["processes"].clear()
    STATE["events"].clear()

    with pytest.raises(KeyError) as excinfo:
        delete_event_node("e999")

    assert excinfo.value.args[0] == "Event e999 not found"  

