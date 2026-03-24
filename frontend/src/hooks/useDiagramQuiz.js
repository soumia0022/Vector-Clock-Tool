import { useState } from "react";
import { askAI } from "../api/AIApi";
import {
  getDiagramQuestion,
  checkDiagramAnswer,
} from "../api/vectorClockApi";

export function useDiagramQuiz(setGlobalError) {
  const [diagramQuizQuestion, setDiagramQuizQuestion] = useState(null);
  const [diagramQuizResult, setDiagramQuizResult] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  const generateQuiz = async () => {
    setBusy(true);
    setDiagramQuizResult("");
    setAiExplanation("");
    setCorrectAnswer("");

    try {
      const data = await getDiagramQuestion();
      if (!data.ok) throw new Error(data.error);
      setDiagramQuizQuestion(data.question);
    } catch (e) {
      setGlobalError?.(String(e));
    } finally {
      setBusy(false);
    }
  };

  const checkAnswer = async (selectedAnswer) => {
    if (!diagramQuizQuestion) return;

    setBusy(true);

    try {
      const data = await checkDiagramAnswer(
        diagramQuizQuestion.type,
        diagramQuizQuestion.event_a,
        diagramQuizQuestion.event_b,
        selectedAnswer
      );

      if (!data.ok) throw new Error(data.error);

      setCorrectAnswer(data.correct_answer);

      setDiagramQuizResult(
        data.correct
          ? "✅ Correct"
          : `❌ Incorrect. Correct answer: ${data.correct_answer}`
      );
    } catch (e) {
      setGlobalError?.(String(e));
    } finally {
      setBusy(false);
    }
  };

  const closeQuiz = () => {
    setDiagramQuizQuestion(null);
    setDiagramQuizResult("");
    setAiExplanation("");
    setCorrectAnswer("");
  };

  const askAIExplanation = async () => {
    if (!diagramQuizQuestion || !correctAnswer) return;

    setAiLoading(true);
    setAiExplanation("");

    try {
      const prompt = `
Explain this vector clock diagram question using the current diagram state.

Question: ${diagramQuizQuestion.question}

Correct answer: ${correctAnswer}

Question type: ${diagramQuizQuestion.type}

Event A: ${diagramQuizQuestion.event_a}
Event B: ${diagramQuizQuestion.event_b}

Explain clearly and briefly.
Use the event IDs in your explanation.
`;

      const res = await askAI(prompt);
      setAiExplanation(res.reply);
    } catch (e) {
      setAiExplanation("Error: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  return {
    diagramQuizQuestion,
    diagramQuizResult,
    busy,
    generateQuiz,
    checkAnswer,
    closeQuiz,
    aiExplanation,
    aiLoading,
    askAIExplanation,
  };
}