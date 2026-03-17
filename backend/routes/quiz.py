from flask import Blueprint, jsonify, request
from state import STATE
bp = Blueprint("quiz", __name__)
from services.quiz import get_random_theory_question, check_theory_answer, get_random_diagram_question, check_diagram_question_answer


@bp.get("/quiz/diagram")
def random_diagram_question():
    try:
        question = get_random_diagram_question()
        return jsonify({"ok": True, "question": question})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@bp.post("/quiz/diagram/check")
def check_diagram():
    try:
        data = request.get_json(force=True)

        result = check_diagram_question_answer(
            question_type=data["type"],
            event_a=data["event_a"],
            event_b=data["event_b"],
            selected_answer=data["selected_answer"],
        )

        return jsonify({"ok": True, **result})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


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


    