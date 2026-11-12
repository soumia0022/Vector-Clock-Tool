# Vector Clock Visualiser

An interactive web tool for learning how **vector clocks** track causality in distributed systems. You build a scenario by adding processes, local events and messages, and the tool draws a space-time diagram. It shows how each vector clock is updated, which events *happen before* others, and which are *concurrent*.

My individual final-year project for my BSc Computer Science at King's College London (Feb–Apr 2026).

### 🔗 [Live demo](https://vector-clock-tool.vercel.app/)

The frontend is hosted on Vercel and the Flask API on Render. The API runs on a free plan that sleeps when it isn't used, so **the first load can take up to a minute**. The demo keeps one shared scenario in memory, so it resets when the server restarts.

---

## Why vector clocks?

Processes in a distributed system have no shared global clock, so you can't just compare timestamps to decide which event came first. Vector clocks fix this: each process keeps a counter for every process. Comparing two vectors shows whether one event **causally precedes** another, or whether the two are **concurrent**. The ideas are simple, but they're hard to picture from static lecture slides. This tool makes them visual and hands-on.

---

## Features

- **Build your own scenario:** add or remove processes, create local events, and send messages between processes.
- **Space-time diagram:** a D3.js diagram of processes, events and messages, with the vector clock shown at every event.
- **Happens-before and concurrency analysis:** select events to see whether one causally precedes the other or whether they are concurrent.
- **Step-by-step playback:** replay a scenario event by event and watch the clocks update.
- **Quizzes:** diagram questions generated from your own scenario ("Does e3 happen before e7?"), plus theory questions, all with instant feedback.
- **Optional AI tutor:** a chat panel that answers questions about the diagram on screen. It's switched off unless an API token is configured.

---

## Tech stack

| Area | Technologies |
|---|---|
| Frontend | React 19, Vite, JavaScript |
| Visualisation | D3.js |
| Backend | Python, Flask (REST API with blueprints) |
| Testing | pytest + coverage (backend), Vitest + React Testing Library (frontend) |
| CI | GitHub Actions: backend tests run on every push, with a **90% coverage** minimum |
| Hosting | Vercel (frontend), Render (Flask API with Gunicorn) |

---

## How it works

```text
React + D3 frontend  ──REST/JSON──▶  Flask backend
 (diagram, playback,                  routes/    → HTTP endpoints
  quizzes, panels)                    services/  → vector clock logic, analysis, quizzes
                                      state.py   → current scenario
```

- **Services layer:** pure Python functions that update vector clocks on local, send and receive events, and work out the happens-before and concurrent relationships. Keeping this logic separate from the routes made it easy to test thoroughly.
- **REST API** endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/state` | Current processes, events and relationships |
| `POST` / `DELETE` | `/process`, `/process/<pid>` | Add or remove a process |
| `POST` | `/event/local`, `/event/send` | Create a local event or send a message |
| `DELETE` | `/event/<event_id>` | Remove an event |
| `POST` | `/analysis/happens-before`, `/analysis/concurrent` | Compare events |
| `GET` / `POST` | `/quiz/diagram`, `/quiz/theory` (+ `/check`) | Generate and mark quiz questions |
| `GET` | `/health` | Health check |

---

## Testing and quality

- **97 automated tests:** 68 backend (pytest) and 29 frontend (Vitest).
- The CI pipeline fails if backend coverage drops below **90%**.
- Lighthouse scores: **92 accessibility, 100 best practices, 90 SEO**.

---

## Getting started

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm

### 1. Backend

```bash
git clone https://github.com/soumia0022/Vector-Clock-Tool.git
cd Vector-Clock-Tool/backend

python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python app.py                      # runs on http://127.0.0.1:5000
```

### 2. Frontend (in a second terminal)

```bash
cd Vector-Clock-Tool/frontend
npm install
npm run dev                        # open the URL shown, usually http://localhost:5173
```

Both servers need to be running.

### 3. Optional: AI tutor

The tutor uses GitHub Models. To turn it on, create `backend/.env`:

```env
GITHUB_TOKEN=your-token-here
```

`.env` files are git-ignored. Never commit tokens. Without a token, the rest of the app works normally.

---

## Running tests

```bash
# Backend (from /backend)
python -m pytest --cov=.

# Frontend (from /frontend)
npm run test:run
```

---

## What I learned

- Turning a theoretical topic (logical clocks, causal ordering) into correct, testable code, and checking it against worked examples.
- Designing a clean split between a React frontend and a Flask REST API, and keeping core logic in a separate, well-tested services layer.
- Setting up CI with coverage enforcement so that changes can't quietly reduce test quality.
- Designing for accessibility and evaluating it with Lighthouse.

## Future improvements

- Per-user sessions, so each visitor gets their own scenario.
- Persist scenarios so they can be saved and shared.
- Add Lamport (scalar) clocks side by side for comparison.
- More quiz question types and a scoring summary.

---

## Author

**Soumia Bekhli**, BSc Computer Science (First Class), King's College London
