export default function Toolbar({
  busy,
  canGenerateDiagramQuiz,
  onGenerateQuiz,
  onGenerateDiagramQuiz,
}) {
  return (
    <div className="toolbar-wrap">
      <div className="toolbar">
        <div className="toolbar-group">
          <button
            onClick={onGenerateQuiz}
            disabled={busy}
            className="btn btn-secondary"
          >
            Theory quiz
          </button>

          <button
            onClick={onGenerateDiagramQuiz}
            disabled={busy || !canGenerateDiagramQuiz}
            className="btn btn-secondary"
          >
            Diagram quiz
          </button>
        </div>
      </div>
    </div>
  );
}