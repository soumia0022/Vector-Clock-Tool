from flask import Blueprint, jsonify, request
from state import STATE
bp = Blueprint("quiz", __name__)
from services.quiz import get_random_theory_question, check_theory_answer, get_random_hb_question, check_hb_question_answer

@bp.get("/quiz/diagram/happens-before")
def get_diagram_hb_question():
    try:
        question = get_random_hb_question()
    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400

    return jsonify({"ok": True, "question": question})


@bp.post("/quiz/diagram/happens-before/check")
def check_diagram_hb_question():
    data = request.get_json(silent=True) or {}

    event_a = data.get("event_a")
    event_b = data.get("event_b")
    selected_answer = data.get("selected_answer")

    if not event_a or not event_b or not selected_answer:
        return jsonify({
            "ok": False,
            "error": "Missing 'event_a', 'event_b' or 'selected_answer'"
        }), 400

    result = check_hb_question_answer(event_a, event_b, selected_answer)
    return jsonify({"ok": True, **result})


@bp.get("/quiz/theory")
def get_theory_quiz_question():
    question = get_random_theory_question()
    return jsonify({"ok": True, "question": question})


@bp.post("/quiz/theory/check")
def check_theory_quiz_answer():
    data = request.get_json(silent=True) or {}
    question_id = data.get("question_id")
    selected_answer = data.get("selected_answer")

    if question_id is None or selected_answer is None:
        return jsonify({
            "ok": False,
            "error": "Missing 'question_id' or 'selected_answer'"
        }), 400

    try:
        result = check_theory_answer(question_id, selected_answer)
    except KeyError as e:
        return jsonify({"ok": False, "error": e.args[0]}), 404

    return jsonify({"ok": True, **result})