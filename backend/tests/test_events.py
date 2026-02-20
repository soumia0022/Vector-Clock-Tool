from services.events import add_local_event, delete_event_node, send_message
from services.processes import add_process
from services.refresh import recompute_all_event_timestamps

import pytest
from state import STATE, reset_state

@pytest.fixture(autouse=True)
def reset():
    reset_state()
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

def test_create_send_event():
    pid1 = add_process()
    pid2 = add_process()

    eid_send = send_message(pid1, pid2)

    assert any(ev["id"] == eid_send[0] for ev in STATE["events"])
    ev_send = next(ev for ev in STATE["events"] if ev["id"] == eid_send[0])
    assert ev_send["type"] == "SEND"
    assert ev_send["process"] == pid1
    assert ev_send["timestamp"] == [1, 0]   

    assert any(ev["id"] == eid_send[1] for ev in STATE["events"])
    ev_receive = next(ev for ev in STATE["events"] if ev["id"] == eid_send[1])
    assert ev_receive["type"] == "RECEIVE"
    assert ev_receive["process"] == pid2
    assert ev_receive["timestamp"] == [1, 1]   

def test_delete_send_event():
    pid1 = add_process()
    pid2 = add_process()

    eid_send, eid_receive = send_message(pid1, pid2)

    delete_event_node(eid_send)

    assert not any(ev["id"] == eid_send for ev in STATE["events"])
    assert not any(ev["id"] == eid_receive for ev in STATE["events"])

def test_delete_receive_event():
    pid1 = add_process()
    pid2 = add_process()

    eid_send, eid_receive = send_message(pid1, pid2)

    delete_event_node(eid_receive)

    assert not any(ev["id"] == eid_send for ev in STATE["events"])
    assert not any(ev["id"] == eid_receive for ev in STATE["events"])


def test_send_receive_after_locals_on_both_processes():
    p1 = add_process()
    p2 = add_process()

    add_local_event(p1)  # p1: [1,0]
    add_local_event(p2)  # p2: [0,1]
    send_id, recv_id = send_message(p1, p2)

    ev_send = next(ev for ev in STATE["events"] if ev["id"] == send_id)
    ev_recv = next(ev for ev in STATE["events"] if ev["id"] == recv_id)

    assert ev_send["timestamp"] == [2, 0]   # p1 increments to 2
    assert ev_recv["timestamp"] == [2, 2]   # max([0,1],[2,0])=[2,1], then +1 on p2 => [2,2]

def test_delete_send_deletes_message_record():
    p1 = add_process()
    p2 = add_process()
    send_id, recv_id = send_message(p1, p2)

    assert len(STATE["messages"]) == 1
    msg_id = next(ev for ev in STATE["events"] if ev["id"] == send_id)["message_id"]

    delete_event_node(send_id)

    assert all(m["id"] != msg_id for m in STATE["messages"])
    assert len(STATE["events"]) == 0

def test_send_message_wrong_from_pid():
    p1 = add_process()
    with pytest.raises(KeyError, match="Process P999 not found"):
        send_message("P999", p1)

def test_send_message_wrong_to_pid():
    p1 = add_process()
    with pytest.raises(KeyError, match="Process P999 not found"):
        send_message(p1, "P999")

def test_recompute_receive_merge_branch():
    p1 = add_process()
    p2 = add_process()

    add_local_event(p2)  # makes p2 vector non-zero so merge is meaningful
    send_id, recv_id = send_message(p1, p2)

    recompute_all_event_timestamps()

    recv_ev = next(ev for ev in STATE["events"] if ev["id"] == recv_id)
    assert recv_ev["type"] == "RECEIVE"

    # after recompute:
    # p2 had [0,1] already, send is [1,0], merge -> [1,1], then increment p2 -> [1,2]
    assert recv_ev["timestamp"] == [1, 2]

