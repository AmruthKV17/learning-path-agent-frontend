import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { generateQuizFromTopics } from "./services/geminiService";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

export default function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const topics = useMemo(() => location.state?.topics || [], [location.state]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [id]: index }
  const [submitted, setSubmitted] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(null);
  const [totalSec, setTotalSec] = useState(null);
  const [showMandatoryWarning, setShowMandatoryWarning] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const q = await generateQuizFromTopics(topics);
        setQuiz(q);
        const secs = Math.max(30, (q?.questions?.length || 0) * 30); // half the number of questions in minutes → 30s per question
        setTotalSec(secs);
        setTimeLeftSec(secs);
      } catch (e) {
        setError(e.message || "Failed to generate quiz");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [topics]);

  const handleSelect = (qid, idx) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qid]: idx }));
    setShowMandatoryWarning(false);
  };

  const score = useMemo(() => {
    if (!quiz || !submitted) return 0;
    return quiz.questions.reduce((acc, q) => acc + (answers[q.id] === q.answerIndex ? 1 : 0), 0);
  }, [quiz, submitted, answers]);

  const questions = quiz?.questions || [];
  const current = questions[currentIdx];
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] != null);

  // Countdown timer
  useEffect(() => {
    if (!questions.length || submitted || timeLeftSec == null) return;
    if (timeLeftSec <= 0) {
      setSubmitted(true);
      return;
    }
    const id = setInterval(() => setTimeLeftSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [questions.length, submitted, timeLeftSec]);

  const mm = Math.floor((timeLeftSec ?? 0) / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor((timeLeftSec ?? 0) % 60)
    .toString()
    .padStart(2, "0");
  const timePct = totalSec ? Math.max(0, Math.min(100, Math.round((timeLeftSec / totalSec) * 100))) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border p-8 w-full max-w-xl text-center">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
          <p className="text-gray-600 mt-3">Generating your personalized quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border p-8 w-full max-w-xl text-center">
          <XCircle className="w-10 h-10 text-red-500 mx-auto" />
          <p className="text-gray-800 font-semibold mt-3">Unable to generate quiz</p>
          <p className="text-gray-600 mt-1">{error}</p>
          <button onClick={() => navigate(-1)} className="mt-5 px-4 py-2 bg-black text-white rounded-lg">Go Back</button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!allAnswered) {
      setShowMandatoryWarning(true);
      const firstUnansweredIdx = questions.findIndex((q) => answers[q.id] == null);
      if (firstUnansweredIdx >= 0) setCurrentIdx(firstUnansweredIdx);
      return;
    }
    setSubmitted(true);
  };
  const handleRetake = () => {
    setAnswers({});
    setSubmitted(false);
    setCurrentIdx(0);
    if (totalSec != null) setTimeLeftSec(totalSec);
    setShowMandatoryWarning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <nav className="flex items-center justify-between px-6 py-4">
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow inline-flex items-center space-x-2"><ArrowLeft className="w-4 h-4" /><span>Back</span></button>
        <div className="flex flex-col items-end">
          <div className="text-sm text-gray-600 flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>{mm}:{ss}</span>
            <span className="hidden sm:inline">• {questions.length} questions</span>
          </div>
          {/* Timer bar */}
          <div className="mt-2 w-48 sm:w-64 h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${timePct > 50 ? 'bg-green-500' : timePct > 20 ? 'bg-amber-400' : 'bg-red-500'}`}
              style={{ width: `${timePct}%` }}
            />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pb-16">
        <header className="text-center pt-4 pb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Knowledge Check</h1>
          <p className="text-gray-600 mt-2">Topics: {topics.join(", ")}</p>
        </header>

        {!submitted ? (
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">Question {currentIdx + 1} of {questions.length} • <span className="capitalize">{current.level}</span></div>
              <div className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">{current.topic}</div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">{current.question}</h2>

            <div className="grid gap-3">
              {current.choices.map((choice, idx) => {
                const selected = answers[current.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(current.id, idx)}
                    className={`text-left px-4 py-3 rounded-lg border transition-colors ${selected ? "bg-amber-50 border-amber-300" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}
                  >
                     {choice}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="flex space-x-2">
                {questions.map((q, i) => (
                  <div key={q.id} className={`w-2.5 h-2.5 rounded-full ${i === currentIdx ? "bg-amber-600" : answers[q.id] != null ? "bg-amber-300" : "bg-gray-300"}`}></div>
                ))}
              </div>
              <div className="space-x-2">
                <button disabled={currentIdx === 0} onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))} className="px-3 py-2 bg-white border rounded-lg disabled:opacity-50">Prev</button>
                {currentIdx < questions.length - 1 ? (
                  <button
                    disabled={answers[current.id] == null}
                    onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                    className="px-3 py-2 bg-black text-white rounded-lg disabled:opacity-40"
                  >
                    Next
                  </button>
                ) : (
                  <button disabled={!allAnswered} onClick={handleSubmit} className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-40">Submit</button>
                )}
              </div>
            </div>

            {showMandatoryWarning && (
              <div className="mt-4 flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                Please answer all questions before submitting. You have been taken to the first unanswered question.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Your Results</h2>
            </div>
            <p className="text-gray-700 mb-4">You scored <span className="font-semibold">{score}</span> out of {questions.length}.</p>

            <div className="space-y-4">
              {questions.map((q) => {
                const correct = answers[q.id] === q.answerIndex;
                return (
                  <div key={q.id} className={`p-4 rounded-lg border ${correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                    <div className="font-medium text-gray-900">{q.question}</div>
                    <div className="text-sm mt-1">Your answer: {q.choices[answers[q.id]] ?? "—"}</div>
                    <div className="text-sm">Correct answer: {q.choices[q.answerIndex]}</div>
                    {q.explanation && <div className="text-sm text-gray-600 mt-1">{q.explanation}</div>}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end mt-6 space-x-2">
              <button onClick={handleRetake} className="px-4 py-2 bg-white border rounded-lg">Retake</button>
              <button onClick={() => navigate("/")} className="px-4 py-2 bg-black text-white rounded-lg">Home</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
