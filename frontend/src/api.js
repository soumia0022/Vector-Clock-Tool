const API = "http://localhost:5000";

export async function getState() {
  const r = await fetch(`${API}/state`);
  return r.json();
}

export async function createProcess() {
  const r = await fetch(`${API}/process`, { method: "POST" });
  return r.json();
}

export async function deleteProcess(pid) {
  const r = await fetch(`${API}/process/${pid}`, { method: "DELETE" });
  return r.json();
}

export async function addLocalEvent(pid) {
  const r = await fetch(`${API}/event/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ process: pid }),
  });
  return r.json();
}
