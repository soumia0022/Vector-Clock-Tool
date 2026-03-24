import pytest
import services.quiz as quiz_module
from state import STATE, reset_state


@pytest.fixture(autouse=True)
def clean_state():
    reset_state()
    yield
    reset_state()


def test_get_random_hb_question_yes(monkeypatch):
    STATE["events"] = [
        {"id": "e1", "process": "P1", "timestamp": [1, 0]},
        {"id": "e2", "process": "P2", "timestamp": [1, 1]},
    ]
    STATE["hb"] = [{"from": "e1", "to": "e2"}]

    monkeypatch.setattr(
        quiz_module.random,
        "sample",
        lambda events, n: [events[0], events[1]],
    )

    question = quiz_module.get_random_hb_question()

    assert question["type"] == "diagram_hb"
    assert question["event_a"] == "e1"
    assert question["event_b"] == "e2"
    assert question["answer"] == "Yes"
    assert question["options"] == ["Yes", "No"]


def test_get_random_hb_question_no(monkeypatch):
    STATE["events"] = [
        {"id": "e1", "process": "P1", "timestamp": [1, 0]},
        {"id": "e2", "process": "P2", "timestamp": [0, 1]},
    ]
    STATE["hb"] = []

    monkeypatch.setattr(
        quiz_module.random,
        "sample",
        lambda events, n: [events[0], events[1]],
    )

    question = quiz_module.get_random_hb_question()

    assert question["answer"] == "No"
    assert question["question"] == "Does e1 happen before e2?"


def test_get_random_hb_question_needs_two_events():
    STATE["events"] = [{"id": "e1", "process": "P1", "timestamp": [1]}]
    STATE["hb"] = []

    with pytest.raises(ValueError, match="Need at least 2 events"):
        quiz_module.get_random_hb_question()


def test_get_random_concurrent_question(monkeypatch):
    STATE["co"] = [{"event1": "e2", "event2": "e5"}]

    monkeypatch.setattr(
        quiz_module.random,
        "choice",
        lambda pairs: pairs[0],
    )

    question = quiz_module.get_random_concurrent_question()

    assert question["type"] == "diagram_concurrent"
    assert question["event_a"] == "e2"
    assert question["event_b"] == "e5"
    assert question["answer"] == "Yes"
    assert question["options"] == ["Yes", "No"]


def test_get_random_concurrent_question_no_pairs():
    STATE["co"] = []

    with pytest.raises(ValueError, match="No concurrent event pairs available"):
        quiz_module.get_random_concurrent_question()


def test_get_random_diagram_question_returns_concurrent(monkeypatch):
    STATE["co"] = [{"event1": "e2", "event2": "e5"}]

    monkeypatch.setattr(
        quiz_module.random,
        "choice",
        lambda seq: True if seq == [True, False] else seq[0],
    )

    question = quiz_module.get_random_diagram_question()

    assert question["type"] == "diagram_concurrent"


def test_get_random_diagram_question_returns_hb_when_no_co(monkeypatch):
    STATE["events"] = [
        {"id": "e1", "process": "P1", "timestamp": [1, 0]},
        {"id": "e2", "process": "P2", "timestamp": [1, 1]},
    ]
    STATE["hb"] = [{"from": "e1", "to": "e2"}]
    STATE["co"] = []

    monkeypatch.setattr(
        quiz_module.random,
        "sample",
        lambda events, n: [events[0], events[1]],
    )

    question = quiz_module.get_random_diagram_question()

    assert question["type"] == "diagram_hb"


def test_check_diagram_question_answer_hb_correct():
    STATE["hb"] = [{"from": "e1", "to": "e2"}]

    result = quiz_module.check_diagram_question_answer(
        "diagram_hb",
        "e1",
        "e2",
        "Yes",
    )

    assert result == {
        "correct": True,
        "correct_answer": "Yes",
    }


def test_check_diagram_question_answer_hb_incorrect():
    STATE["hb"] = [{"from": "e1", "to": "e2"}]

    result = quiz_module.check_diagram_question_answer(
        "diagram_hb",
        "e2",
        "e1",
        "Yes",
    )

    assert result == {
        "correct": False,
        "correct_answer": "No",
    }


def test_check_diagram_question_answer_concurrent_correct_forward():
    STATE["co"] = [{"event1": "e3", "event2": "e4"}]

    result = quiz_module.check_diagram_question_answer(
        "diagram_concurrent",
        "e3",
        "e4",
        "Yes",
    )

    assert result == {
        "correct": True,
        "correct_answer": "Yes",
    }


def test_check_diagram_question_answer_concurrent_correct_reverse():
    STATE["co"] = [{"event1": "e3", "event2": "e4"}]

    result = quiz_module.check_diagram_question_answer(
        "diagram_concurrent",
        "e4",
        "e3",
        "Yes",
    )

    assert result == {
        "correct": True,
        "correct_answer": "Yes",
    }


def test_check_diagram_question_answer_concurrent_incorrect():
    STATE["co"] = [{"event1": "e3", "event2": "e4"}]

    result = quiz_module.check_diagram_question_answer(
        "diagram_concurrent",
        "e3",
        "e5",
        "Yes",
    )

    assert result == {
        "correct": False,
        "correct_answer": "No",
    }


def test_check_diagram_question_answer_unknown_type():
    with pytest.raises(ValueError, match="Unknown question type"):
        quiz_module.check_diagram_question_answer(
            "unknown_type",
            "e1",
            "e2",
            "Yes",
        )


def test_get_random_theory_question(monkeypatch):
    monkeypatch.setattr(
        quiz_module.random,
        "choice",
        lambda questions: questions[0],
    )

    question = quiz_module.get_random_theory_question()

    assert question == {
        "id": 1,
        "question": "What does a local event do in a vector clock?",
        "options": [
            "Increment all components",
            "Increment its own component",
            "Reset the vector clock",
            "Take the maximum of two clocks",
        ],
    }


def test_check_theory_answer_correct():
    result = quiz_module.check_theory_answer(1, "Increment its own component")

    assert result == {
        "correct": True,
        "correct_answer": "Increment its own component",
    }


def test_check_theory_answer_incorrect():
    result = quiz_module.check_theory_answer(1, "Reset the vector clock")

    assert result == {
        "correct": False,
        "correct_answer": "Increment its own component",
    }


def test_check_theory_answer_not_found():
    with pytest.raises(KeyError, match="Question 999 not found"):
        quiz_module.check_theory_answer(999, "Anything")