import { getResultClass } from "../../utils/resultClass";

export default function DiagramQuizCard({
  question,
  result,
  busy,
  canNext,
  onCheckAnswer,
  onClose,
  onNext,
  aiExplanation,
  aiLoading,
  onAskAI,
}) {
  if (!question) return null;

  return (
    <div className="quiz-card">
      <div className="quiz-header-row">
        <h3 className="diagram-header">Diagram Quiz</h3>
        <button
          onClick={onClose}
          className="close-button"
          aria-label="Close diagram quiz"
        >
          ×
        </button>
      </div>

      <p className="quiz-question">{question.question}</p>

      <div className="quiz-options-row">
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => onCheckAnswer(option)}
            disabled={busy}
            className="option-button option-button-wide"
          >
            {option}
          </button>
        ))}
      </div>

      {result && (
        <>
          <div className={getResultClass(result)}>
            {result}
          </div>

          <button
            onClick={onAskAI}
            disabled={aiLoading || !result}
            className="btn-primary btn ask-ai-button "
          >
            {aiLoading ? "Thinking..." : "Ask AI"}
          </button>

          {aiExplanation && (
            <div className="ai-explanation">
              {aiExplanation}
            </div>
          )}
        </>
      )}

      <div className="quiz-actions">
        <button
          onClick={onNext}
          disabled={busy || !canNext}
          className="btn-primary btn"
        >
          Next question
        </button>
      </div>
    </div>
  );
}