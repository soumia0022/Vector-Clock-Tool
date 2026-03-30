const API = "https://vector-clock-tool.onrender.com/";

export async function askAI(question) {
  const r = await fetch(`${API}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  return r.json();
}