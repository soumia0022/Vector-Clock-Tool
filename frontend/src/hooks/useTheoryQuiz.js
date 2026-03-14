import { useState } from "react";
import {
  getTheoryQuestion,
  checkTheoryAnswer,
} from "../api/vectorClockApi";

export function useTheoryQuiz(setGlobalError) {
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [quizResult, setQuizResult] = useState("");
  const [busy, setBusy] = useState(false);

  const generateQuiz = async () => {
    setBusy(true);
    setQuizResult("");

    try {
      const data = await getTheoryQuestion();
      if (!data.ok) throw new Error(data.error);
      setQuizQuestion(data.question);
    } catch (e) {
      setGlobalError?.(String(e));
    } finally {
      setBusy(false);
    }
  };

  const checkAnswer = async (selectedAnswer) => {
    if (!quizQuestion) return;

    setBusy(true);

    try {
      const data = await checkTheoryAnswer(quizQuestion.id, selectedAnswer);
      if (!data.ok) throw new Error(data.error);

      setQuizResult(
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
    setQuizQuestion(null);
    setQuizResult("");
  };

  return {
    quizQuestion,
    quizResult,
    busy,
    generateQuiz,
    checkAnswer,
    closeQuiz,
  };
}