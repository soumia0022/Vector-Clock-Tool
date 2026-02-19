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

export async function deleteEvent(eventId) {
  const r = await fetch(`${API}/event/${eventId}`, {
    method: "DELETE",
  });
  return r.json();
}

export async function sendMessage(fromPid, toPid) {
  const r = await fetch(`${API}/event/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: fromPid, to: toPid }),
  });
  return r.json();
}

export async function computeHappensBefore() {
  const r = await fetch(`${API}/analysis/happens-before`, {
    method: "POST",
  });
  return r.json();
}


