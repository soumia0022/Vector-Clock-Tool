import { useState } from "react";
import { askAI } from "../api/AIApi";
import {
  getTheoryQuestion,
  checkTheoryAnswer,
} from "../api/vectorClockApi";

export function useTheoryQuiz(setGlobalError) {
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [quizResult, setQuizResult] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  const generateQuiz = async () => {
    setBusy(true);
    setQuizResult("");
    setAiExplanation("");
    setCorrectAnswer("");

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

      setCorrectAnswer(data.correct_answer);

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
    setAiExplanation("");
    setCorrectAnswer("");
  };

  const askAIExplanation = async () => {

    if (!quizQuestion || !correctAnswer) return;

    setAiLoading(true);
    setAiExplanation("");

    try {
      const prompt = `
Explain this vector clock theory question:

Question: ${quizQuestion.question}

Correct answer: ${correctAnswer}

Explain clearly and briefly. dont ansk the user, just explain the concept behind the question and why the correct answer is correct. Use simple language and examples if possible.
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
    quizQuestion,
    quizResult,
    busy,
    generateQuiz,
    checkAnswer,
    closeQuiz,
    aiExplanation,
    aiLoading,
    askAIExplanation,
  };
}