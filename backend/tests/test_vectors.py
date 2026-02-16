import pytest
from state import STATE, reset_state
from services.vectors import (
    new_zero_vector,
    process_index,
    latest_vector_for_process,
    recompute_all_vectors,
    recompute_all_event_timestamps,
)



@pytest.fixture(autouse=True)
def reset():
    reset_state()



def test_new_zero_vector():
    assert new_zero_vector(0) == []
    assert new_zero_vector(3) == [0, 0, 0]
    assert new_zero_vector(5) == [0, 0, 0, 0, 0]



def test_process_index_valid():
    STATE["processes"] = ["P1", "P2", "P3"]
    assert process_index("P1") == 0
    assert process_index("P2") == 1
    assert process_index("P3") == 2


def test_process_index_invalid():
    STATE["processes"] = ["P1", "P2"]

    with pytest.raises(ValueError) as excinfo:
        process_index("P999")

    assert excinfo.value.args[0] == "Unknown process_id: P999"



def test_latest_vector_no_events():
    STATE["processes"] = ["P1", "P2"]
    STATE["events"] = []

    assert latest_vector_for_process("P1") == [0, 0]


def test_latest_vector_returns_last_event():
    STATE["processes"] = ["P1", "P2"]

    STATE["events"] = [
        {"id": "e1", "process": "P1", "timestamp": [1, 0]},
        {"id": "e2", "process": "P2", "timestamp": [1, 1]},
        {"id": "e3", "process": "P1", "timestamp": [2, 1]},
    ]

    assert latest_vector_for_process("P1") == [2, 1]
    assert latest_vector_for_process("P2") == [1, 1]



def test_recompute_all_vectors_extends():
    STATE["processes"] = ["P1", "P2", "P3"]

    STATE["events"] = [
        {"id": "e1", "process": "P1", "timestamp": [1, 0]},  # length 2
    ]

    recompute_all_vectors()

    assert STATE["events"][0]["timestamp"] == [1, 0, 0]


def test_recompute_all_vectors_truncates():
    STATE["processes"] = ["P1", "P2"]

    STATE["events"] = [
        {"id": "e1", "process": "P1", "timestamp": [1, 0, 5]},
    ]

    recompute_all_vectors()

    assert STATE["events"][0]["timestamp"] == [1, 0]



def test_recompute_all_event_timestamps_single_process():
    STATE["processes"] = ["P1"]

    STATE["events"] = [
        {"id": "e1", "process": "P1", "timestamp": [99]},  # garbage
        {"id": "e2", "process": "P1", "timestamp": [42]},  # garbage
    ]

    recompute_all_event_timestamps()

    assert STATE["events"][0]["timestamp"] == [1]
    assert STATE["events"][1]["timestamp"] == [2]


def test_recompute_all_event_timestamps_multiple_processes():
    STATE["processes"] = ["P1", "P2"]

    STATE["events"] = [
        {"id": "e1", "process": "P1", "timestamp": [99, 99]},
        {"id": "e2", "process": "P2", "timestamp": [99, 99]},
        {"id": "e3", "process": "P1", "timestamp": [99, 99]},
    ]

    recompute_all_event_timestamps()

    # Expected:
    # e1 (P1): [1,0]
    # e2 (P2): [0,1]
    # e3 (P1): [2,0]

    assert STATE["events"][0]["timestamp"] == [1, 0]
    assert STATE["events"][1]["timestamp"] == [0, 1]
    assert STATE["events"][2]["timestamp"] == [2, 0]
