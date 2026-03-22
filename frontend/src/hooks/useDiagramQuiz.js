import { useState } from "react";
import {
  getDiagramQuestion,
  checkDiagramAnswer,
} from "../api/vectorClockApi";

export function useDiagramQuiz(setGlobalError) {
  const [diagramQuizQuestion, setDiagramQuizQuestion] = useState(null);
  const [diagramQuizResult, setDiagramQuizResult] = useState("");
  const [busy, setBusy] = useState(false);

  const generateQuiz = async () => {
    setBusy(true);
    setDiagramQuizResult("");

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
  };

  return {
    diagramQuizQuestion,
    diagramQuizResult,
    busy,
    generateQuiz,
    checkAnswer,
    closeQuiz,
  };
}