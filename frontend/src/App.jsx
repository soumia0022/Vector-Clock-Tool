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

export default function App() {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [quizQuestion, setQuizQuestion] = useState(null);
  const [quizResult, setQuizResult] = useState("");

  const [diagramQuizQuestion, setDiagramQuizQuestion] = useState(null);
  const [diagramQuizResult, setDiagramQuizResult] = useState("");

  const [hoveredPid, setHoveredPid] = useState(null);

  const loadState = async () => {
    setError("");
    const data = await getState();
    setState(data);
  };

  useEffect(() => {
    loadState().catch((e) => setError(String(e)));
  }, []);

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
                events={state.events}
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