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

export async function computeConcurrentEvents() {
  const r = await fetch(`${API}/analysis/concurrent`, {
    method: "POST",
  });
  return r.json();
}
export async function getTheoryQuestion() {
  const r = await fetch(`${API}/quiz/theory`);
  return r.json();
}

export async function checkTheoryAnswer(questionId, selectedAnswer) {
  const r = await fetch(`${API}/quiz/theory/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question_id: questionId,
      selected_answer: selectedAnswer,
    }),
  });
  return r.json();
}

export async function getDiagramHBQuestion() {
  const r = await fetch(`${API}/quiz/diagram/happens-before`);
  return r.json();
}

export async function checkDiagramHBAnswer(eventA, eventB, selectedAnswer) {
  const r = await fetch(`${API}/quiz/diagram/happens-before/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_a: eventA,
      event_b: eventB,
      selected_answer: selectedAnswer,
    }),
  });
  return r.json();
}
