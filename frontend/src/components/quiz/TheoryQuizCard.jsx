import { getResultClass } from "../../utils/resultClass";

export default function TheoryQuizCard({
  question,
  result,
  busy,
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
        <h3 className="theory-header">Theory Quiz</h3>
        <button
          onClick={onClose}
          className="close-button"
          aria-label="Close theory quiz"
        >
          ×
        </button>
      </div>

      <p className="quiz-question">{question.question}</p>

      <div className="quiz-options-column">
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => onCheckAnswer(option)}
            disabled={busy}
            className="option-button"
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
      onClick={() => {onAskAI(); console.log("ASK AI CLICKED"); }}
      disabled={aiLoading}
      className="btn-primary btn ask-ai-button"
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
          disabled={busy}
          className="btn-primary btn"
        >
          Next question
        </button>
      </div>
    </div>
  );
}