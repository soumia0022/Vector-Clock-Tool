import { useMemo, useState } from "react";

import Toolbar from "./components/layout/Toolbar";
import AnalysisPanel from "./components/layout/AnalysisPanel";
import DebugPanel from "./components/layout/DebugPanel";
import PlaybackPanel from "./components/playback/PlaybackPanel";
import TheoryQuizCard from "./components/quiz/TheoryQuizCard";
import DiagramQuizCard from "./components/quiz/DiagramQuizCard";
import ProcessGrid from "./components/process/ProcessGrid";
import LamportDiagram from "./components/diagram/LamportDiagram";

import { useVectorClockState } from "./hooks/useVectorClockState";
import { usePlayback } from "./hooks/usePlayback";
import { useTheoryQuiz } from "./hooks/useTheoryQuiz";
import { useDiagramQuiz } from "./hooks/useDiagramQuiz";

import { getEventExplanation } from "./utils/eventExplanation";

import "./styles/theme.css";
import "./styles/app.css";

export default function App() {
  const [hoveredPid, setHoveredPid] = useState(null);
  const [quizError, setQuizError] = useState("");

  const {
    state,
    busy: stateBusy,
    error: stateError,
    handleAddProcess,
    handleDeleteProcess,
    handleAddEvent,
    handleDeleteEvent,
    handleSendMessage,
  } = useVectorClockState();

  const eventsLength = state?.events.length ?? 0;

  const playback = usePlayback(eventsLength);

  const theoryQuiz = useTheoryQuiz(setQuizError);
  const diagramQuiz = useDiagramQuiz(setQuizError);

  const currentExplanation = useMemo(() => {
    return getEventExplanation(state, playback.playIndex);
  }, [state, playback.playIndex]);

  const visibleEvents = useMemo(() => {
    return state ? state.events.slice(0, playback.playIndex) : [];
  }, [state, playback.playIndex]);

  const combinedBusy =
    stateBusy || theoryQuiz.busy || diagramQuiz.busy;

  const error = stateError || quizError;

  return (
    <div className="app-page">
      <div className="app-container">
        <h1 className="app-heading">Vector Clock Tool</h1>
        <p className="app-subheading">
          Build distributed event diagrams, explore causality, and test yourself with quizzes.
        </p>

        {error && <div className="error-box">{error}</div>}

        <Toolbar
          busy={combinedBusy}
          canGenerateDiagramQuiz={eventsLength >= 2}
          onGenerateQuiz={theoryQuiz.generateQuiz}
          onGenerateDiagramQuiz={diagramQuiz.generateQuiz}
        />

        <PlaybackPanel
          state={state}
          currentExplanation={currentExplanation}
          busy={combinedBusy}
          isPlaying={playback.isPlaying}
          playIndex={playback.playIndex}
          speedMultiplier={playback.speedMultiplier}
          setIsPlaying={playback.setIsPlaying}
          setSpeedMultiplier={playback.setSpeedMultiplier}
          progressPercent={playback.progressPercent}
          onReset={playback.reset}
          onStepBack={playback.stepBack}
          onStepForward={playback.stepForward}
          onJumpToEnd={playback.jumpToEnd}
          onScrub={(e) => {
            if (!state) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            const nextIndex = Math.round(ratio * state.events.length);
            playback.jumpToIndex(nextIndex);
          }}
        />

        <DiagramQuizCard
          question={diagramQuiz.diagramQuizQuestion}
          result={diagramQuiz.diagramQuizResult}
          busy={diagramQuiz.busy}
          canNext={eventsLength >= 2}
          onCheckAnswer={diagramQuiz.checkAnswer}
          onClose={diagramQuiz.closeQuiz}
          onNext={diagramQuiz.generateQuiz}
        />

        <TheoryQuizCard
          question={theoryQuiz.quizQuestion}
          result={theoryQuiz.quizResult}
          busy={theoryQuiz.busy}
          onCheckAnswer={theoryQuiz.checkAnswer}
          onClose={theoryQuiz.closeQuiz}
          onNext={theoryQuiz.generateQuiz}
        />

        {state && (
          <div className="main-grid">
            <AnalysisPanel state={state} />

            <div className="diagram-card">
              <LamportDiagram
                processes={state.processes}
                events={visibleEvents}
                onAddProcess={handleAddProcess}
                canAdd={!combinedBusy}
                highlightProcess={hoveredPid}
                animateMessages={true}
                playIndex={playback.playIndex}
              />
            </div>

            <div className="side-panel">
              <ProcessGrid
                processes={state.processes}
                events={state.events}
                busy={combinedBusy}
                onDelete={handleDeleteProcess}
                onAddEvent={handleAddEvent}
                onDeleteEvent={handleDeleteEvent}
                onAddProcess={handleAddProcess}
                onSendMessage={handleSendMessage}
                setHoveredPid={setHoveredPid}
              />
            </div>
          </div>
        )}

        <DebugPanel state={state} />
      </div>
    </div>
  );
}