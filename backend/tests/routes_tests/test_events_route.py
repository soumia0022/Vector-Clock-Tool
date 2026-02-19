import pytest
from state import STATE, reset_state
from app import create_app  # adjust if your create_app is elsewhere


@pytest.fixture(autouse=True)
def reset():
    reset_state()


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    return app.test_client()


def test_create_local_event_missing_process_returns_400(client):
    r = client.post("/event/local", json={})
    assert r.status_code == 400
    data = r.get_json()
    assert data["ok"] is False
    assert "Missing 'process'" in data["error"]


def test_create_local_event_invalid_pid_returns_404(client):
    # no processes exist yet, so pid invalid
    r = client.post("/event/local", json={"process": "P999"})
    assert r.status_code == 404
    data = r.get_json()
    assert data["ok"] is False
    # depending on your service error type/message
    assert "not found" in data["error"] or "Unknown" in data["error"]


def test_create_local_event_success_returns_200(client):
    # create P1 via state directly (or call /process if you have that route)
    STATE["processes"].append("P1")

    r = client.post("/event/local", json={"process": "P1"})
    assert r.status_code == 200
    data = r.get_json()

    assert data["ok"] is True
    assert "event_id" in data
    assert data["event_id"].startswith("e")
    assert "state" in data
    assert len(data["state"]["events"]) == 1
    assert data["state"]["events"][0]["process"] == "P1"


def test_create_local_event_for_pid_success_returns_200(client):
    STATE["processes"].append("P1")

    r = client.post("/event/local/P1")
    assert r.status_code == 200
    data = r.get_json()

    assert data["ok"] is True
    assert data["event_id"] == "e1"
    assert len(data["state"]["events"]) == 1
    assert data["state"]["events"][0]["timestamp"]  # should exist


def test_delete_event_unknown_returns_404(client):
    r = client.delete("/event/e999")
    assert r.status_code == 404
    data = r.get_json()
    assert data["ok"] is False
    # KeyError messages sometimes include quotes
    assert "not found" in data["error"].lower() or "e999" in data["error"]


def test_delete_event_success_returns_200_and_removes_event(client):
    STATE["processes"].append("P1")

    # create an event
    r1 = client.post("/event/local", json={"process": "P1"})
    assert r1.status_code == 200
    event_id = r1.get_json()["event_id"]
    assert len(STATE["events"]) == 1

    # delete it
    r2 = client.delete(f"/event/{event_id}")
    assert r2.status_code == 200
    data = r2.get_json()
    assert data["ok"] is True
    assert len(data["state"]["events"]) == 0
    assert len(STATE["events"]) == 0

def test_create_send_event_success_returns_200(client):
    STATE["processes"].clear()
    STATE["events"].clear()
    STATE["messages"].clear()

    STATE["processes"].append("P1")
    STATE["processes"].append("P2")

    r = client.post("/event/send", json={"from": "P1", "to": "P2"})
    assert r.status_code == 200
    data = r.get_json()

    assert data["ok"] is True
    assert "send_event" in data
    assert "receive_event" in data
    assert data["send_event"].startswith("e")
    assert data["receive_event"].startswith("e")

    assert "state" in data
    assert len(data["state"]["events"]) == 2

    send_ev = next(ev for ev in data["state"]["events"] if ev["id"] == data["send_event"])
    recv_ev = next(ev for ev in data["state"]["events"] if ev["id"] == data["receive_event"])

    assert send_ev["type"] == "SEND"
    assert send_ev["process"] == "P1"

    assert recv_ev["type"] == "RECEIVE"
    assert recv_ev["process"] == "P2"
