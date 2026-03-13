import { useEffect, useState } from "react";
import {
  getState,
  createProcess,
  deleteProcess,
  addLocalEvent,
  deleteEvent,
  sendMessage,
  getTheoryQuestion,
  checkTheoryAnswer,
  getDiagramHBQuestion,
  checkDiagramHBAnswer,
} from "./api";

import ProcessGrid from "./components/ProcessGrid";
import LamportDiagram from "./components/LamportDiagram";

// Importing CSS files for styling
import "./styles/theme.css";
import "./styles/app.css";
function zeroVector(length) {
  return Array(length).fill(0);
}

function vectorsEqual(a = [], b = []) {
  if (a.length !== b.length) return false;
  return a.every((value, i) => value === b[i]);
}

function vectorMax(a = [], b = []) {
  return a.map((value, i) => Math.max(value, b[i]));
}

function findPreviousEventForProcess(events, pid, beforeIndex) {
  for (let i = beforeIndex - 1; i >= 0; i--) {
    if (events[i].process === pid) return events[i];
  }
  return null;
}

function findMatchingSendEvent(events, receiveEvent, receiveIndex) {
  if (!receiveEvent?.message_id) return null;

  for (let i = receiveIndex - 1; i >= 0; i--) {
    const ev = events[i];
    if (ev.type === "SEND" && ev.message_id === receiveEvent.message_id) {
      return ev;
    }
  }
  return null;
}

function getEventExplanation(state, playIndex) {
  if (!state || playIndex <= 0 || playIndex > state.events.length) return null;

  const events = state.events;
  const currentIndex = playIndex - 1;
  const event = events[currentIndex];
  const processCount = state.processes.length;
  const processIndex = state.processes.indexOf(event.process);

  const previousEvent = findPreviousEventForProcess(events, event.process, currentIndex);
  const beforeVector = previousEvent
    ? [...previousEvent.timestamp]
    : zeroVector(processCount);

  const afterVector = [...event.timestamp];

  if (event.type === "LOCAL") {
    const expected = [...beforeVector];
    expected[processIndex] += 1;

    return {
      title: `${event.id} — Local event on ${event.process}`,
      rule: `${event.process} increments its own entry by 1 for a local event.`,
      before: beforeVector,
      after: afterVector,
      highlightIndex: processIndex,
      extra:
        vectorsEqual(expected, afterVector)
          ? `Before [${beforeVector.join(", ")}] → after [${afterVector.join(", ")}].`
          : `Expected [${expected.join(", ")}], stored [${afterVector.join(", ")}].`,
    };
  }

  if (event.type === "SEND") {
    const expected = [...beforeVector];
    expected[processIndex] += 1;

    return {
      title: `${event.id} — Send event from ${event.process}`,
      rule: `A send is also an event, so ${event.process} increments its own entry by 1 before sending.`,
      before: beforeVector,
      after: afterVector,
      highlightIndex: processIndex,
      extra: event.message_id
        ? `Message ${event.message_id} carries timestamp [${afterVector.join(", ")}].`
        : `The sent message carries timestamp [${afterVector.join(", ")}].`,
    };
  }

  if (event.type === "RECEIVE") {
    const sendEvent = findMatchingSendEvent(events, event, currentIndex);
    const receiverBefore = beforeVector;

    if (sendEvent) {
      const merged = vectorMax(receiverBefore, sendEvent.timestamp);
      const expected = [...merged];
      expected[processIndex] += 1;

      return {
        title: `${event.id} — Receive event on ${event.process}`,
        rule: `On receive, take the element-wise max of the receiver clock and the message timestamp, then increment the receiver's own entry by 1.`,
        before: receiverBefore,
        after: afterVector,
        highlightIndex: processIndex,
        messageVector: [...sendEvent.timestamp],
        mergedVector: merged,
        extra: `max([${receiverBefore.join(", ")}], [${sendEvent.timestamp.join(", ")}]) = [${merged.join(", ")}], then increment ${event.process} → [${afterVector.join(", ")}].`,
      };
    }

    return {
      title: `${event.id} — Receive event on ${event.process}`,
      rule: `A receive takes the max with the incoming message timestamp, then increments the receiver's own entry by 1.`,
      before: receiverBefore,
      after: afterVector,
      highlightIndex: processIndex,
      extra: `Final stored timestamp: [${afterVector.join(", ")}].`,
    };
  }

  return {
    title: `${event.id} — ${event.type} on ${event.process}`,
    rule: `This event updates the vector clock.`,
    before: beforeVector,
    after: afterVector,
    highlightIndex: processIndex,
    extra: `Stored timestamp: [${afterVector.join(", ")}].`,
  };
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const baseSpeed = 700; // base step speed
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [quizQuestion, setQuizQuestion] = useState(null);
  const [quizResult, setQuizResult] = useState("");

  const [diagramQuizQuestion, setDiagramQuizQuestion] = useState(null);
  const [diagramQuizResult, setDiagramQuizResult] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const baseSpeed = 700;
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const [hoveredPid, setHoveredPid] = useState(null);
  const currentExplanation = getEventExplanation(state, playIndex);

  const loadState = async () => {
    setError("");
    const data = await getState();
    setState(data);
  };

  useEffect(() => {
    loadState().catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
  if (!state) return;
  // start at end by default, or start at 0 if you prefer
  setPlayIndex(state.events.length);
}, [state]);

  useEffect(() => {
  if (!state) return;
  if (!isPlaying) return;

  const max = state.events.length;

  const t = setInterval(() => {
    setPlayIndex((i) => {
      if (i >= max) {
        // stop at the end
        setIsPlaying(false);
        return max;
      }
      return i + 1;
    });
  }, baseSpeed / speedMultiplier);

  return () => clearInterval(t);
}, [isPlaying, speedMultiplier, state]);

  const visibleEvents = state ? state.events.slice(0, playIndex) : [];

  const progressPercent =
  state && state.events.length > 0
    ? (playIndex / state.events.length) * 100
    : 0;

  const handleAddProcess = async () => {
    setBusy(true);
    try {
      const data = await createProcess();
      if (!data.ok) throw new Error(data.error);
      await loadState();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
  if (!state) return;
  setPlayIndex(state.events.length);
}, [state]);

useEffect(() => {
  if (!state) return;
  if (!isPlaying) return;

  const max = state.events.length;

  const t = setInterval(() => {
    setPlayIndex((i) => {
      if (i >= max) {
        setIsPlaying(false);
        return max;
      }
      return i + 1;
    });
  }, baseSpeed / speedMultiplier);

  return () => clearInterval(t);
}, [isPlaying, speedMultiplier, state]);

  const handleDeleteProcess = async (pid) => {
    setBusy(true);
    try {
      const data = await deleteProcess(pid);
      if (!data.ok) throw new Error(data.error);
      await loadState();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleAddEvent = async (pid) => {
    setBusy(true);
    try {
      const data = await addLocalEvent(pid);
      if (!data.ok) throw new Error(data.error);
      await loadState();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    setBusy(true);
    try {
      const data = await deleteEvent(eventId);
      if (!data.ok) throw new Error(data.error);
      await loadState();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleGenerateDiagramQuiz = async () => {
    setBusy(true);
    setDiagramQuizResult("");
    try {
      const data = await getDiagramHBQuestion();
      if (!data.ok) throw new Error(data.error);
      setDiagramQuizQuestion(data.question);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleCheckDiagramQuizAnswer = async (selectedAnswer) => {
    if (!diagramQuizQuestion) return;

    setBusy(true);
    try {
      const data = await checkDiagramHBAnswer(
        diagramQuizQuestion.event_a,
        diagramQuizQuestion.event_b,
        selectedAnswer
      );

      if (!data.ok) throw new Error(data.error);

      if (data.correct) {
        setDiagramQuizResult("✅ Correct");
      } else {
        setDiagramQuizResult(`❌ Incorrect. Correct answer: ${data.correct_answer}`);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleSendMessage = async (fromPid, toPid) => {
    setBusy(true);
    try {
      const data = await sendMessage(fromPid, toPid);
      if (!data.ok) throw new Error(data.error);
      await loadState();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  

  const handleGenerateQuiz = async () => {
    setBusy(true);
    setQuizResult("");
    try {
      const data = await getTheoryQuestion();
      if (!data.ok) throw new Error(data.error);
      setQuizQuestion(data.question);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleCheckQuizAnswer = async (selectedAnswer) => {
    if (!quizQuestion) return;

    setBusy(true);
    try {
      const data = await checkTheoryAnswer(quizQuestion.id, selectedAnswer);
      if (!data.ok) throw new Error(data.error);

      if (data.correct) {
        setQuizResult("✅ Correct");
      } else {
        setQuizResult(`❌ Incorrect. Correct answer: ${data.correct_answer}`);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleCloseTheoryQuiz = () => {
    setQuizQuestion(null);
    setQuizResult("");
  };

  const handleCloseDiagramQuiz = () => {
    setDiagramQuizQuestion(null);
    setDiagramQuizResult("");
  };

  const resultClass = (result) => {
    if (!result) return "";
    return result.startsWith("✅")
      ? "result-box correct"
      : "result-box incorrect";
  };

  const visibleEvents = state ? state.events.slice(0, playIndex) : [];

  const progressPercent =
  state && state.events.length > 0
    ? (playIndex / state.events.length) * 100
    : 0;

  return (

    <div className="app-page">
      <div className="app-container">
        <h1 className="app-heading">Vector Clock Tool</h1>
        <p className="app-subheading">
          Build distributed event diagrams, explore causality, and test yourself with quizzes.
        </p>

        {error && <div className="error-box">{error}</div>}



        <div className="toolbar-wrap">
          <div className="toolbar">
            <div className="toolbar-group">
              <button
                onClick={handleGenerateQuiz}
                disabled={busy}
                className="btn btn-secondary"
              >
                Theory quiz
              </button>

              <button
                onClick={handleGenerateDiagramQuiz}
                disabled={busy || !state || state.events.length < 2}
                className="btn btn-secondary"
              >
                Diagram quiz
              </button>
            </div>
          </div>
        </div>

        {state && (
  <div className="playback-card">
        {currentExplanation ? (
      <div className="playback-explanation">
        <div className="playback-explanation__header">
          <h3 className="playback-explanation__title">
            {currentExplanation.title}
          </h3>
          <span className="playback-explanation__step">
            Event {playIndex} of {state.events.length}
          </span>
        </div>

        <p className="playback-explanation__rule">
          {currentExplanation.rule}
        </p>

        <div className="playback-explanation__extra">
          {currentExplanation.extra}
        </div>
      </div>
    ) : (
      <div className="playback-explanation playback-explanation--empty">
        Start playback or step through events to see how the vector clock changes.
      </div>
    )}
    <div className="playback-controls">
      <button
        onClick={() => {
          setIsPlaying(false);
          setPlayIndex(0);
        }}
        disabled={busy || state.events.length === 0}
        className="btn btn-outline"
      >
        Reset
      </button>

      <button
        onClick={() => {
          setIsPlaying(false);
          setPlayIndex((i) => Math.max(0, i - 1));
        }}
        disabled={busy || state.events.length === 0 || playIndex === 0}
        className="btn btn-outline"
      >
        Step ◀
      </button>

      <button
        onClick={() => setIsPlaying((p) => !p)}
        disabled={busy || state.events.length === 0}
        className="btn btn-secondary"
      >
        {isPlaying ? "Pause" : "Play"}
      </button>

      <button
        onClick={() => {
          setIsPlaying(false);
          setPlayIndex((i) => Math.min(state.events.length, i + 1));
        }}
        disabled={busy || state.events.length === 0 || playIndex >= state.events.length}
        className="btn btn-outline"
      >
        Step ▶
      </button>

      <button
        onClick={() => {
          setIsPlaying(false);
          setPlayIndex(state.events.length);
        }}
        disabled={busy || state.events.length === 0}
        className="btn btn-outline"
      >
        Jump to end
      </button>

      <div className="playback-speed">
        <span className="playback-speed__label">Speed</span>

        {[0.5, 0.75, 1, 1.5, 2].map((s) => (
          <button
            key={s}
            onClick={() => setSpeedMultiplier(s)}
            className={`speed-pill ${speedMultiplier === s ? "is-active" : ""}`}
          >
            x{s}
          </button>
        ))}
      </div>

      <div className="playback-count">
        {playIndex}/{state.events.length} events
      </div>
    </div>

    <div
      className="playback-progress"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const nextIndex = Math.round(ratio * state.events.length);
        setIsPlaying(false);
        setPlayIndex(nextIndex);
      }}
      title="Jump to a point in the replay"
    >
      <div
        className="playback-progress__bar"
        style={{
          width: `${progressPercent}%`,
          transition: isPlaying ? "width 0.2s linear" : "width 0.2s ease",
        }}
      />
    </div>

    <div className="playback-progress__meta">
      <span>Progress</span>
      <span>
        {playIndex} / {state.events.length} events
      </span>
    </div>
  </div>
)}

        {diagramQuizQuestion && (
          <div className="quiz-card">
            <div className="quiz-header-row">
              <h3 className="diagram-header">Diagram Quiz</h3>
              <button
                onClick={handleCloseDiagramQuiz}
                className="close-button"
                aria-label="Close diagram quiz"
              >
                ×
              </button>
            </div>

            <p className="quiz-question">{diagramQuizQuestion.question}</p>

            <div className="quiz-options-row">
              {diagramQuizQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleCheckDiagramQuizAnswer(option)}
                  disabled={busy}
                  className="option-button option-button-wide"
                >
                  {option}
                </button>
              ))}
            </div>

            {diagramQuizResult && (
              <div className={resultClass(diagramQuizResult)}>
                {diagramQuizResult}
              </div>
            )}

            <div className="quiz-actions">
              <button
                onClick={handleGenerateDiagramQuiz}
                disabled={busy || !state || state.events.length < 2}
                className="btn btn-outline"
              >
                Next diagram question
              </button>
            </div>
          </div>
        )}

        {quizQuestion && (
          <div className="quiz-card">
            <div className="quiz-header-row">
              <h3 className="theory-header">Theory Quiz</h3>
              <button
                onClick={handleCloseTheoryQuiz}
                className="close-button"
                aria-label="Close theory quiz"
              >
                ×
              </button>
            </div>

            <p className="quiz-question">{quizQuestion.question}</p>

            <div className="quiz-options-column">
              {quizQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleCheckQuizAnswer(option)}
                  disabled={busy}
                  className="option-button"
                >
                  {option}
                </button>
              ))}
            </div>

            {quizResult && (
              <div className={resultClass(quizResult)}>{quizResult}</div>
            )}

            <div className="quiz-actions">
              <button
                onClick={handleGenerateQuiz}
                disabled={busy}
                className="btn btn-outline"
              >
                Next theory question
              </button>
            </div>
          </div>
        )}

        {state && (
          <div className="main-grid">
            <div className="side-panel">
              <div className="side-panel-title">Analysis</div>

              <div className="section-title">Happens-before</div>
              {state.hb?.length ? (
                <ul className="analysis-list">
                  {state.hb.map((e, idx) => (
                    <li key={idx}>
                      {e.from} → {e.to}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="muted-text">Not computed yet.</div>
              )}

              <hr className="divider" />

              <div className="section-title">Concurrent pairs</div>
              {state.co?.length ? (
                <ul className="analysis-list">
                  {state.co.map((p, idx) => (
                    <li key={idx}>
                      {(p.event1 ?? p.a)} ‖ {(p.event2 ?? p.b)}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="muted-text">Not computed yet.</div>
              )}
            </div>

            <div className="diagram-card">
              <LamportDiagram
                processes={state.processes}
                events={visibleEvents}
                onAddProcess={handleAddProcess}
                canAdd={!busy}
                highlightProcess={hoveredPid}
                animateMessages={true}
              />
            </div>

            <div className="side-panel">
          
              <ProcessGrid
                processes={state.processes}
                events={state.events}
                busy={busy}
                onDelete={handleDeleteProcess}
                onAddEvent={handleAddEvent}
                onDeleteEvent={handleDeleteEvent}
                onAddProcess={handleAddProcess}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>
        )}

        {state && (
          <pre className="debug-card">
            {JSON.stringify(state, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}