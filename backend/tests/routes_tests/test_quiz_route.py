import pytest
from app import app
import routes.quiz as quiz_module


@pytest.fixture
def client():
    with app.test_client() as client:
        yield client


# =========================
# 📊 DIAGRAM QUIZ
# =========================

def test_get_diagram_question_success(client, monkeypatch):
    def mock_get_question():
        return {"question": "Does e1 happen before e2?"}

    monkeypatch.setattr(quiz_module, "get_random_diagram_question", mock_get_question)

    res = client.get("/quiz/diagram")
    data = res.get_json()

    assert res.status_code == 200
    assert data["ok"] is True
    assert "question" in data


def test_get_diagram_question_failure(client, monkeypatch):
    def mock_fail():
        raise Exception("diagram error")

    monkeypatch.setattr(quiz_module, "get_random_diagram_question", mock_fail)

    res = client.get("/quiz/diagram")
    data = res.get_json()

    assert res.status_code == 400
    assert data["ok"] is False
    assert "diagram error" in data["error"]


def test_check_diagram_success(client, monkeypatch):
    def mock_check(**kwargs):
        return {"correct": True, "correct_answer": "Yes"}

    monkeypatch.setattr(quiz_module, "check_diagram_question_answer", mock_check)

    res = client.post(
        "/quiz/diagram/check",
        json={
            "type": "hb",
            "event_a": "e1",
            "event_b": "e2",
            "selected_answer": "Yes",
        },
    )

    data = res.get_json()

    assert res.status_code == 200
    assert data["ok"] is True
    assert data["correct"] is True


def test_check_diagram_failure(client, monkeypatch):
    def mock_fail(**kwargs):
        raise Exception("check failed")

    monkeypatch.setattr(quiz_module, "check_diagram_question_answer", mock_fail)

    res = client.post(
        "/quiz/diagram/check",
        json={
            "type": "hb",
            "event_a": "e1",
            "event_b": "e2",
            "selected_answer": "Yes",
        },
    )

    data = res.get_json()

    assert res.status_code == 400
    assert data["ok"] is False
    assert "check failed" in data["error"]


# =========================
# 📚 THEORY QUIZ
# =========================

def test_get_theory_question_success(client, monkeypatch):
    def mock_get():
        return {"id": 1, "question": "Test?", "options": ["A", "B"]}

    monkeypatch.setattr(quiz_module, "get_random_theory_question", mock_get)

    res = client.get("/quiz/theory")
    data = res.get_json()

    assert res.status_code == 200
    assert data["ok"] is True
    assert "question" in data


def test_check_theory_success(client, monkeypatch):
    def mock_check(qid, answer):
        return {"correct": True, "correct_answer": "A"}

    monkeypatch.setattr(quiz_module, "check_theory_answer", mock_check)

    res = client.post(
        "/quiz/theory/check",
        json={"question_id": 1, "selected_answer": "A"},
    )

    data = res.get_json()

    assert res.status_code == 200
    assert data["ok"] is True
    assert data["correct"] is True


def test_check_theory_missing_fields(client):
    res = client.post("/quiz/theory/check", json={})
    data = res.get_json()

    assert res.status_code == 400
    assert data["ok"] is False
    assert "Missing" in data["error"]


def test_check_theory_not_found(client, monkeypatch):
    def mock_check(qid, answer):
        raise KeyError("Question not found")

    monkeypatch.setattr(quiz_module, "check_theory_answer", mock_check)

    res = client.post(
        "/quiz/theory/check",
        json={"question_id": 999, "selected_answer": "A"},
    )

    data = res.get_json()

    assert res.status_code == 404
    assert data["ok"] is False
    assert "Question not found" in data["error"]