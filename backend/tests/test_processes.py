import pytest
from services.processes import add_process, delete_process
from services.events import add_local_event, send_message
from state import STATE, reset_state


@pytest.fixture(autouse=True)
def setup():
    reset_state()


def test_add_process_returns_incrementing_pid_and_extends_existing_event_timestamps():
    p1 = add_process()
    assert p1 == "P1"
    assert STATE["processes"] == ["P1"]

    # make an event before adding a new process
    e1 = add_local_event(p1)
    ev1 = next(ev for ev in STATE["events"] if ev["id"] == e1)
    assert ev1["timestamp"] == [1]

    # add P2: existing timestamps should be extended with 0
    p2 = add_process()
    assert p2 == "P2"
    assert STATE["processes"] == ["P1", "P2"]

    ev1 = next(ev for ev in STATE["events"] if ev["id"] == e1)
    assert ev1["timestamp"] == [1, 0]


def test_delete_nonexistent_process_raises():
    with pytest.raises(KeyError) as excinfo:
        delete_process("P999")
    assert excinfo.value.args[0] == "Process P999 not found"


def test_delete_process_removes_its_events_and_shrinks_timestamp_dimension():
    # P1, P2, P3
    p1 = add_process()
    p2 = add_process()
    p3 = add_process()
    assert STATE["processes"] == ["P1", "P2", "P3"]

    # one local event per process
    e1 = add_local_event(p1)
    e2 = add_local_event(p2)
    e3 = add_local_event(p3)
    assert len(STATE["events"]) == 3

    deleted_index = delete_process("P2")
    assert deleted_index == 1

    # P3 renumbers to P2
    assert STATE["processes"] == ["P1", "P2"]

    # only events from old P1 and old P3 remain -> now P1 and P2
    assert len(STATE["events"]) == 2
    assert sorted(ev["process"] for ev in STATE["events"]) == ["P1", "P2"]

    # timestamps now have 2 dimensions
    for ev in STATE["events"]:
        assert len(ev["timestamp"]) == 2


def test_delete_process_cascades_messages_and_message_linked_events():
    p1 = add_process()
    p2 = add_process()
    p3 = add_process()

    # message between P2 and P3 (will be deleted when P2 is deleted)
    s1, r1 = send_message(p2, p3)
    msg_id_1 = next(ev for ev in STATE["events"] if ev["id"] == s1)["message_id"]

    # message between P1 and P2 (will also be deleted when P2 is deleted)
    s2, r2 = send_message(p1, p2)
    msg_id_2 = next(ev for ev in STATE["events"] if ev["id"] == s2)["message_id"]

    assert {m["id"] for m in STATE["messages"]} == {msg_id_1, msg_id_2}

    delete_process("P2")

    # after renumbering processes: old P3 becomes P2, so processes are still length 2
    assert STATE["processes"] == ["P1", "P2"]

    # all messages involving deleted old P2 are removed
    assert STATE["messages"] == []

    # and all events linked to those messages are removed too (both sends+receives)
    assert STATE["events"] == []


def test_delete_process_renames_message_endpoints_for_remaining_messages():
    # create 3 processes
    p1 = add_process()  # P1
    p2 = add_process()  # P2
    p3 = add_process()  # P3

    # create a message between P1 and P3 (P3 will become P2 after deleting P2)
    send_id, recv_id = send_message(p1, p3)
    assert len(STATE["messages"]) == 1
    assert STATE["messages"][0]["from"] == "P1"
    assert STATE["messages"][0]["to"] == "P3"

    # delete middle process P2 -> old P3 renames to P2
    delete_process("P2")
    assert STATE["processes"] == ["P1", "P2"]

    # message should still exist, but 'to' should be rewritten from old P3 -> new P2
    assert len(STATE["messages"]) == 1
    assert STATE["messages"][0]["from"] == "P1"
    assert STATE["messages"][0]["to"] == "P2"

    # events also should have their process fields renamed consistently
    processes_in_events = {ev["process"] for ev in STATE["events"]}
    assert processes_in_events.issubset({"P1", "P2"})


def test_delete_process_returns_correct_deleted_index():
    p1 = add_process()
    p2 = add_process()
    p3 = add_process()

    assert delete_process("P1") == 0
    reset_state()

    p1 = add_process()
    p2 = add_process()
    p3 = add_process()
    assert delete_process("P3") == 2
