import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
import { buildHbChains } from "./utils/hbChains";
import { buildConcurrentGroups } from "./utils/concurrentGroups";

import AiPanel from "./components/ai/AiPanel";


import "./styles/theme.css";
import "./styles/app.css";

export default function App() {
  const [hoveredPid, setHoveredPid] = useState(null);
  const [quizError, setQuizError] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  

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

  const [activeHbChain, setActiveHbChain] = useState(null);
  const [activeConcurrentGroup, setActiveConcurrentGroup] = useState(null);


  const hbChains = useMemo(() => {
    return buildHbChains(state?.hb || []);
  }, [state]);

  const concurrentGroups = useMemo(() => {
  return buildConcurrentGroups(state?.co || []);
  }, [state]);

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
      {showWelcome &&
  createPortal(
    <div className="welcome-modal__backdrop">
      <div className="welcome-modal">
        <div className="welcome-modal__header">
          <button onClick={() => setShowWelcome(false)}>×</button>
          <h2>Welcome to the Vector Clock Tool</h2>
          
        </div>

        <div className="welcome-modal__body">
          <p>
            This tool helps you visualise vector clocks and understand causality
            in distributed systems.
          </p>

          <ul>
            <li>Build event diagrams</li>
            <li>Explore happens-before and concurrency</li>
            <li>Use playback to step through events</li>
            <li>Test yourself with quizzes</li>
            <li>Ask AI for explanations</li>
          </ul>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowWelcome(false)}
        >
          Get started
        </button>
      </div>
    </div>,
    document.body   
  )}
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
          aiExplanation={diagramQuiz.aiExplanation}
          aiLoading={diagramQuiz.aiLoading}
          onAskAI={diagramQuiz.askAIExplanation}
        />

        <TheoryQuizCard
          question={theoryQuiz.quizQuestion}
          result={theoryQuiz.quizResult}
          busy={theoryQuiz.busy}
          onCheckAnswer={theoryQuiz.checkAnswer}
          onClose={theoryQuiz.closeQuiz}
          onNext={theoryQuiz.generateQuiz}
          aiExplanation={theoryQuiz.aiExplanation}
          aiLoading={theoryQuiz.aiLoading}
          onAskAI={theoryQuiz.askAIExplanation}
        />

        {state && (
          <div className="main-grid">
            <AnalysisPanel
             state={state}
             hbChains={hbChains}
             activeHbChain={activeHbChain}
             onHoverChain={setActiveHbChain}
             concurrentGroups={concurrentGroups}
             activeConcurrentGroup={activeConcurrentGroup}
             onHoverConcurrentGroup={setActiveConcurrentGroup}
            />

            <div className="diagram-card">
              <LamportDiagram
                processes={state.processes}
                events={visibleEvents}
                onAddProcess={handleAddProcess}
                canAdd={!combinedBusy}
                highlightProcess={hoveredPid}
                animateMessages={true}
                playIndex={playback.playIndex}
                activeHbChain={activeHbChain}
                activeConcurrentGroup={activeConcurrentGroup}
              />
              <AiPanel/>
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

        
      </div>
    </div>
  );
}