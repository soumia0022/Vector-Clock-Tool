from flask import Blueprint, request, jsonify
from state import STATE
import requests
import os

bp = Blueprint("ai", __name__)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN") 


@bp.post("/ai/chat")
def ai_chat():
    try:
        data = request.get_json(force=True)
        user_question = data["question"]
        if not GITHUB_TOKEN:
            return jsonify({
                "ok": True,
                "reply": "AI feature is not configured. Please add a GITHUB_TOKEN in a .env file to enable AI explanations."
            })

        prompt = f"""
You are an AI teaching assistant for a vector clock visualiser.

Answer the student's question using the CURRENT diagram state only.

Rules:
- Be concise.
- Keep the answer to 3-6 sentences unless the student asks for more detail.
- Refer to specific event IDs like e1, e2, e3 when relevant.
- Do not give a full introduction to vector clocks unless asked.
- If the question is vague, answer briefly and ask one short follow-up question.
- Prefer explaining the exact relationship in the diagram over general theory.

Current diagram state:
Processes: {STATE["processes"]}
Events: {STATE["events"]}
Happens-before: {STATE["hb"]}
Concurrent: {STATE["co"]}

Student question:
{user_question}
"""

        response = requests.post(
            "https://models.inference.ai.azure.com/chat/completions",
            headers={
                "Authorization": f"Bearer {GITHUB_TOKEN}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a concise tutor for a vector clock learning tool. Answer briefly, clearly, and focus on the current diagram."},
                    {"role": "user", "content": prompt},
                ],
                
            },
        )

        ai_text = response.json()["choices"][0]["message"]["content"]

        return jsonify({"ok": True, "reply": ai_text})

    except Exception as e:
        
        return jsonify({"ok": False, "error": str(e)}), 400