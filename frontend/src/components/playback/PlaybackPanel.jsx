import { PLAYBACK_SPEED_OPTIONS } from "../../constants/playback";

export default function PlaybackPanel({
  state,
  currentExplanation,
  busy,
  isPlaying,
  playIndex,
  speedMultiplier,
  setIsPlaying,
  setSpeedMultiplier,
  progressPercent,
  onReset,
  onStepBack,
  onStepForward,
  onScrub,
}) {
  
  if (!state) return null;
  const isFinished = playIndex >= state.events.length;

  return (
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
          onClick={onStepBack}
          disabled={busy || state.events.length === 0 || playIndex === 0}
          className="btn btn-outline"
        >
          Step ◀
        </button>

        <button
          onClick={() => {
            if (isFinished) {
              onReset();          
              setIsPlaying(true); 
            } else {
              setIsPlaying((value) => !value);
            }
          }}
          disabled={busy || state.events.length === 0}
          className="btn btn-secondary"
        >
          {isFinished ? "Replay" : isPlaying ? "Pause" : "Play"}
        </button>

        <button
          onClick={onStepForward}
          disabled={busy || state.events.length === 0 || playIndex >= state.events.length}
          className="btn btn-outline"
        >
          Step ▶
        </button>

        <div className="playback-speed">
          <span className="playback-speed__label">Speed</span>

          {PLAYBACK_SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              onClick={() => setSpeedMultiplier(speed)}
              className={`speed-pill ${speedMultiplier === speed ? "is-active" : ""}`}
            >
              x{speed}
            </button>
          ))}
        </div>

        
      </div>

      <div
        className="playback-progress"
        onClick={onScrub}
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
  );
}