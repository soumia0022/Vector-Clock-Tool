import random
from state import STATE


def get_random_hb_question():
    events = STATE["events"]
    hb_pairs = STATE["hb"]

    if len(events) < 2:
        raise ValueError("Need at least 2 events to generate a diagram quiz question")

    a, b = random.sample(events, 2)

    correct_answer = any(
        pair["from"] == a["id"] and pair["to"] == b["id"]
        for pair in hb_pairs
    )

    return {
        "type": "diagram_hb",
        "question": f"Does {a['id']} happen before {b['id']}?",
        "event_a": a["id"],
        "event_b": b["id"],
        "options": ["Yes", "No"],
        "answer": "Yes" if correct_answer else "No",
    }


def get_random_concurrent_question():
    co_pairs = STATE["co"]

    if not co_pairs:
        raise ValueError("No concurrent event pairs available")

    pair = random.choice(co_pairs)
    event_a = pair["event1"]
    event_b = pair["event2"]

    return {
        "type": "diagram_concurrent",
        "question": f"Are {event_a} and {event_b} concurrent?",
        "event_a": event_a,
        "event_b": event_b,
        "options": ["Yes", "No"],
        "answer": "Yes",
    }


def get_random_diagram_question():
    if STATE["co"] and random.choice([True, False]):
        return get_random_concurrent_question()
    return get_random_hb_question()


def check_diagram_question_answer(question_type, event_a, event_b, selected_answer):
    if question_type == "diagram_hb":
        correct_answer = any(
            pair["from"] == event_a and pair["to"] == event_b
            for pair in STATE["hb"]
        )

    elif question_type == "diagram_concurrent":
        correct_answer = any(
            (pair["event1"] == event_a and pair["event2"] == event_b)
            or (pair["event1"] == event_b and pair["event2"] == event_a)
            for pair in STATE["co"]
        )

    else:
        raise ValueError(f"Unknown question type: {question_type}")

    expected = "Yes" if correct_answer else "No"

    return {
        "correct": selected_answer == expected,
        "correct_answer": expected,
    }

THEORY_QUESTIONS = [
    {
        "id": 1,
        "question": "What does a local event do in a vector clock?",
        "options": [
            "Increment all components",
            "Increment its own component",
            "Reset the vector clock",
            "Take the maximum of two clocks"
        ],
        "answer": "Increment its own component"
    },
    {
        "id": 2,
        "question": "What happens during a receive event in a vector clock?",
        "options": [
            "Increment own component only",
            "Take elementwise max then increment own component",
            "Reset the vector clock",
            "Copy the sender timestamp exactly"
        ],
        "answer": "Take elementwise max then increment own component"
    },
    {
        "id": 3,
        "question": "What does happens-before mean?",
        "options": [
            "Two events are unrelated",
            "One event causally occurred before another",
            "Two events happened on the same process only",
            "Two events have equal timestamps"
        ],
        "answer": "One event causally occurred before another"
    },
    {
        "id": 4,
        "question": "When are two events concurrent?",
        "options": [
            "When one happens before the other",
            "When neither happened before the other",
            "When they have the same event ID",
            "When they are on the same process"
        ],
        "answer": "When neither happened before the other"
    },
    {
        "id": 5,
        "question": "A local event in a vector clock increments only the component of the process where the event occurred.",
        "options": ["True", "False"],
        "answer": "True"
    },
    {
        "id": 6,
        "question": "When a process sends a message, it increments its own vector clock component.",
        "options": ["True", "False"],
        "answer": "True"
    },
    {
        "id": 7,
        "question": "When a process receives a message, it sets its vector clock equal to the sender's clock.",
        "options": ["True", "False"],
        "answer": "False"
    },
    {
        "id": 8,
        "question": "Two events are concurrent if neither event happens before the other.",
        "options": ["True", "False"],
        "answer": "True"
    },
    {
        "id": 9,
        "question": "Vector clocks are used to detect causal relationships between events in distributed systems.",
        "options": ["True", "False"],
        "answer": "True"
    },
    {
        "id": 10,
        "question": "If event A happens before event B, then the vector timestamp of A must be less than or equal to B in every component and strictly less in at least one component.",
        "options": ["True", "False"],
        "answer": "True"
    },
    {
        "id": 11,
        "question": "Two events with identical vector timestamps are always concurrent.",
        "options": ["True", "False"],
        "answer": "False"
    },
    {
        "id": 12,
        "question": "Vector clocks can determine the exact physical time when an event occurred.",
        "options": ["True", "False"],
        "answer": "False"
    },
    {
        "id": 13,
        "question": "If two events occur on the same process, they cannot be concurrent.",
        "options": ["True", "False"],
        "answer": "True"
    },
    {
        "id": 14,
        "question": "The length of a vector clock equals the number of processes in the system.",
        "options": ["True", "False"],
        "answer": "True"
    }
]


def get_random_theory_question():
    q = random.choice(THEORY_QUESTIONS)

    return {
        "id": q["id"],
        "question": q["question"],
        "options": q["options"]
    }


def check_theory_answer(question_id: int, selected_answer: str):
    question = next((q for q in THEORY_QUESTIONS if q["id"] == question_id), None)
    if not question:
        raise KeyError(f"Question {question_id} not found")

    correct = question["answer"] == selected_answer

    return {
        "correct": correct,
        "correct_answer": question["answer"]
    }