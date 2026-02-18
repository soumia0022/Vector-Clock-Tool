import pytest
from state import STATE, reset_state
from app import create_app  


@pytest.fixture(autouse=True)
def reset():
    reset_state()


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    return app.test_client()


def test_get_state_returns_200_and_structure(client):
    r = client.get("/state")
    assert r.status_code == 200
    data = r.get_json()

    assert "processes" in data
    assert "events" in data
    assert "messages" in data
    assert data["processes"] == []
    assert data["events"] == []
    assert data["messages"] == []


def test_create_process_returns_ok_and_pid(client):
    r = client.post("/process")
    assert r.status_code == 200
    data = r.get_json()

    assert data["ok"] is True
    assert data["process_id"] == "P1"
    assert data["state"]["processes"] == ["P1"]


def test_create_multiple_processes_increments_ids(client):
    r1 = client.post("/process").get_json()
    r2 = client.post("/process").get_json()
    r3 = client.post("/process").get_json()

    assert r1["process_id"] == "P1"
    assert r2["process_id"] == "P2"
    assert r3["process_id"] == "P3"
    assert STATE["processes"] == ["P1", "P2", "P3"]


def test_delete_process_success_returns_ok(client):
    client.post("/process")  # P1
    client.post("/process")  # P2

    r = client.delete("/process/P1")
    assert r.status_code == 200
    data = r.get_json()

    assert data["ok"] is True
    assert data["state"]["processes"] == ["P1"]  # old P2 renumbered to P1

    # also check global STATE updated
    assert STATE["processes"] == ["P1"]


def test_delete_process_missing_returns_404(client):
    r = client.delete("/process/P999")
    assert r.status_code == 404
    data = r.get_json()

    assert data["ok"] is False
    assert "not found" in data["error"].lower()
