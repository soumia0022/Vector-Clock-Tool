const API = "https://vector-clock-tool.onrender.com/";

async function readJson(response) {
  return response.json();
}

export async function getState() {
  const response = await fetch(`${API}/state`);
  return readJson(response);
}

export async function createProcess() {
  const response = await fetch(`${API}/process`, {
    method: "POST",
  });
  return readJson(response);
}

export async function deleteProcess(pid) {
  const response = await fetch(`${API}/process/${pid}`, {
    method: "DELETE",
  });
  return readJson(response);
}

export async function addLocalEvent(pid) {
  const response = await fetch(`${API}/event/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ process: pid }),
  });
  return readJson(response);
}

export async function deleteEvent(eventId) {
  const response = await fetch(`${API}/event/${eventId}`, {
    method: "DELETE",
  });
  return readJson(response);
}

export async function sendMessage(fromPid, toPid) {
  const response = await fetch(`${API}/event/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: fromPid, to: toPid }),
  });
  return readJson(response);
}

export async function getTheoryQuestion() {
  const response = await fetch(`${API}/quiz/theory`);
  return readJson(response);
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

export async function getDiagramQuestion() {
  const r = await fetch(`${API}/quiz/diagram`);
  return r.json();
}

export async function checkDiagramAnswer(type, eventA, eventB, selectedAnswer) {
  const r = await fetch(`${API}/quiz/diagram/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      event_a: eventA,
      event_b: eventB,
      selected_answer: selectedAnswer,
    }),
  });
  return r.json();
}