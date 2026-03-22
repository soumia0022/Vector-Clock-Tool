const API = "http://localhost:5000";

export async function askAI(question) {
  const r = await fetch(`${API}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  return r.json();
}