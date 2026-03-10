import random

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
    }
]


def get_random_theory_question():
    q = random.choice(THEORY_QUESTIONS)

    # do not send the answer yet
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