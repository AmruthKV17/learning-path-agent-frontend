import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { generateQuizFromTopics } from "./services/geminiService";
import {LayeredBackground} from 'animated-backgrounds'

export default function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Read total time and questions via router state; provide sensible defaults
  const totalSec = useMemo(() => {
    const v = Number(location.state?.totalSec);
    return Number.isFinite(v) && v > 0 ? v : 300; // default: 5 minutes
  }, [location.state]);

  const questions = useMemo(() => {
    const q = location.state?.questions;
    if (Array.isArray(q) && q.length > 0) return q;
    return null; // we'll fetch from Gemini using topics
  }, [location.state]);

  const topics = useMemo(() => location.state?.topics ?? [], [location.state]);

  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [quizQuestions, setQuizQuestions] = useState(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [id]: choiceIndex }
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreCount, setScoreCount] = useState(0);
  const [timeTakenSec, setTimeTakenSec] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [timeLeftSec, setTimeLeftSec] = useState(totalSec);

  // Reset when totalSec changes
  useEffect(() => {
    setTimeLeftSec(totalSec);
  }, [totalSec]);

  // Decrement every second until 0 (runs only when timer started and not submitted)
  useEffect(() => {
    if (!isTimerRunning || isSubmitted || timeLeftSec <= 0) return;
    const id = setInterval(() => {
      setTimeLeftSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [isTimerRunning, isSubmitted, timeLeftSec]);

  const mm = String(Math.floor((timeLeftSec ?? 0) / 60)).padStart(2, "0");
  const ss = String(Math.floor((timeLeftSec ?? 0) % 60)).padStart(2, "0");

  // Circular timer metrics
  const radius = 36;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalSec
    ? Math.max(0, Math.min(1, (timeLeftSec ?? 0) / totalSec))
    : 0;
  const dashOffset = circumference * (1 - progressRatio);
  const attentionLevel =
    progressRatio <= 0.2 ? "danger" : progressRatio <= 0.5 ? "warn" : "ok";
  const glowColor =
    attentionLevel === "danger"
      ? "rgba(239,68,68,0.75)"
      : attentionLevel === "warn"
      ? "rgba(245,158,11,0.7)"
      : "rgba(59,130,246,0.7)";

  const displayQuestionCount = Array.isArray(quizQuestions)
    ? quizQuestions.length
    : Array.isArray(questions)
    ? questions.length
    : null;

  // Start timer only after quiz is loaded
  useEffect(() => {
    const ready = !loadingQuiz && !isSubmitted && Array.isArray(quizQuestions) && quizQuestions.length > 0;
    if (ready) {
      setIsTimerRunning(true);
    }
  }, [loadingQuiz, quizQuestions, isSubmitted]);

  // Auto-generate quiz when topics are present and no questions yet
  useEffect(() => {
    const shouldGenerate =
      !Array.isArray(quizQuestions) &&
      !Array.isArray(questions) &&
      Array.isArray(topics) &&
      topics.length > 0 &&
      !loadingQuiz &&
      !quizError;
    if (!shouldGenerate) return;
    (async () => {
      try {
        setLoadingQuiz(true);
        const { questions: q } = await generateQuizFromTopics(topics);
        setQuizQuestions(q);
        setQuizError("");
        setCurrentIndex(0);
      } catch (e) {
        setQuizError(e.message || "Failed to generate quiz");
      } finally {
        setLoadingQuiz(false);
      }
    })();
  }, [topics, quizQuestions, questions, loadingQuiz, quizError]);

    const cosmicScene = [
  { 
    animation: 'fireflies', 
    opacity: 0.8, 
    blendMode: 'normal',
    speed: 0.3 
  },
  { 
    animation: 'cosmicDust', 
    opacity: 0.8, 
    blendMode: 'screen',
    speed: 0.8 
  },
  { 
    animation: 'auroraBorealis', 
    opacity: 0.28, 
    blendMode: 'lighten',
    speed: 1.2
  }
];

  return (
    <div className="min-h-screen ">
      <LayeredBackground layers={cosmicScene}/>
      <nav className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 hover:bg-amber-50/35 rounded-lg shadow-sm border hover:shadow-md transition-shadow inline-flex items-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="flex items-center pr-20 space-x-4">
          {/* Circular timer */}
          <div
            className={`relative ${
              attentionLevel === "danger" ? "animate-pulse" : ""
            }`}
            style={{ filter: `drop-shadow(0 0 10px ${glowColor})` }}
          >
            <svg width={88} height={88} viewBox="0 0 88 88" className="block">
              <defs>
                <linearGradient
                  id="timerGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
              {/* Track */}
              <circle
                cx="44"
                cy="44"
                r={radius}
                stroke="#e5e7eb"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress */}
              <circle
                cx="44"
                cy="44"
                r={radius}
                stroke="url(#timerGradient)"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{
                  transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease",
                }}
                transform="rotate(-90 44 44)"
              />
            </svg>
            {/* Orbiting sparkle */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className="w-[88px] h-[88px] rounded-full animate-spin"
                style={{ animationDuration: "8s" }}
              >
                <div className="relative w-full h-full">
                  <div
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white"
                    style={{ boxShadow: `0 0 14px ${glowColor}` }}
                  />
                </div>
              </div>
            </div>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
              <div className="font-semibold tabular-nums text-lg text-gray-800">
                {mm}:{ss}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500">
                Time
              </div>
            </div>
          </div>
        </div>
        <div></div>
        {/* <div className="hidden sm:flex flex-col items-end">
            <div className="text-lg font-medium text-shadow-amber-900 flex items-center space-x-2">
              {<Clock className="w-4 h-4" />
              <span>{mm}:{ss}</span>
              {displayQuestionCount != null && (
                <span className="hidden sm:inline"> {displayQuestionCount} questions</span>
              )}
            </div>
          </div>  */}
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-sky-50/50 rounded-xl border shadow p-6">
          {!isSubmitted && (
            <div>
              <h1 className="text-xl font-semibold mb-2">Quiz</h1>
              <p className="text-gray-600 mb-4">
                Answer the questions before the time runs out.
              </p>
            </div>
          )}

          {/* Loading and error states */}
          {loadingQuiz && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating questions...</span>
            </div>
          )}
          {!loadingQuiz && quizError && (
            <div className="flex items-start space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <span>{quizError}</span>
            </div>
          )}

          {/* Results view */}
          {!loadingQuiz &&
            !quizError &&
            isSubmitted &&
            Array.isArray(quizQuestions) && (
              <div className="mt-4 space-y-6 flex flex-col items-center">
                <h4 className="text-3xl font-medium text-amber-900 ">Your Result</h4>
                {/* Score and time summary */}
                <div className="relative w-full rounded-xl border bg-gradient-to-r from-teal-200/55 via-indigo-100 to-pink-400/50 p-5 overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-teal-200/40 blur-3xl" />
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-sm text-gray-600">Your Score</div>
                      <div className="text-3xl font-extrabold text-gray-900">
                        {scoreCount} / {quizQuestions.length}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Accuracy</div>
                        <div className="text-xl font-semibold text-gray-800">
                          {Math.round(
                            (scoreCount / quizQuestions.length) * 100
                          )}
                          %
                        </div>
                      </div>
                      <div className="w-px h-10 bg-gray-200" />
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Time Taken</div>
                        <div className="text-xl font-semibold text-gray-800">
                          {String(Math.floor(timeTakenSec / 60)).padStart(
                            2,
                            "0"
                          )}
                          :{String(timeTakenSec % 60).padStart(2, "0")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Per-question breakdown */}
                <div className="space-y-4">
                  {quizQuestions.map((q, idx) => {
                    const selectedIdx = answers[q.id];
                    const isCorrect = selectedIdx === q.answerIndex;
                    return (
                      <div
                        key={q.id}
                        className={`rounded-lg border p-4 ${
                          isCorrect
                            ? "bg-green-100/60 border-green-400"
                            : "bg-red-100/70 border-red-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm text-gray-500 mb-1">
                              Q{idx + 1} • {q.topic} • {q.level}
                            </div>
                            <div className="font-medium text-gray-900">
                              {q.question}
                            </div>
                          </div>
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.choices.map((choice, cIdx) => {
                            const isAnswer = cIdx === q.answerIndex;
                            const isSelected = cIdx === selectedIdx;
                            const base = "rounded-md px-3 py-2 border text-sm";
                            const style = isAnswer
                              ? "bg-green-100 border-green-400 text-green-900"
                              : isSelected && !isAnswer
                              ? "bg-red-200/70 border-red-300 text-red-900"
                              : "bg-white border-gray-200 text-gray-700";
                            return (
                              <div key={cIdx} className={`${base} ${style}`}>
                                <span className="mr-2 font-mono text-xs text-gray-500">
                                  {String.fromCharCode(65 + cIdx)}.
                                </span>
                                {choice}
                                {isAnswer && (
                                  <span className="ml-2 text-xs text-green-700">
                                    (correct)
                                  </span>
                                )}
                                {isSelected && !isAnswer && (
                                  <span className="ml-2 text-xs text-red-700">
                                    (your choice)
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <button
                    className="px-4 py-2 border rounded-md bg-amber-50 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setIsSubmitted(false);
                      setCurrentIndex(0);
                      setAnswers({});
                      setTimeLeftSec(totalSec);
                    }}
                  >
                    Retake Quiz
                  </button>
                </div>
              </div>
            )}

          {/* Quiz content */}
          {!loadingQuiz &&
            !quizError &&
            !isSubmitted &&
            Array.isArray(quizQuestions) &&
            quizQuestions.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-500 mb-2">
                  Question {currentIndex + 1} of {quizQuestions.length}
                </div>
                <div className="p-4  rounded-lg bg-gray-50">
                  <div className="font-medium text-gray-900">
                    {currentIndex + 1}. {quizQuestions[currentIndex].question}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Topic: {quizQuestions[currentIndex].topic} • Level:{" "}
                    {quizQuestions[currentIndex].level}
                  </div>
                </div>
                  <div className="mt-4 space-y-2">
                  {quizQuestions[currentIndex].choices.map((choice, idx) => {
                    const qid = quizQuestions[currentIndex].id;
                    const selected = answers[qid] === idx;
                    return (
                      <button
                        key={idx}
                        className={`w-full text-left border rounded-md px-3 py-2 cursor-pointer transition-colors ${
                          selected
                            ? "bg-blue-400/30 border-blue-300"
                            : "bg-white hover:bg-gray-50"
                        }`}
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [qid]: idx }))
                        }
                      >
                        <span className="mr-2 font-mono text-xs text-gray-500">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        {choice}
                      </button>
                    );
                    })}
                </div>
                  {/* Require answer before proceeding */}
                  {answers[quizQuestions[currentIndex].id] === undefined && (
                    <div className="mt-2 text-xs text-amber-700">Please select an answer to continue.</div>
                  )}

                <div className="mt-4 flex justify-between">
                  <button
                    className="px-3 py-2 border rounded-md bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                  >
                    Previous
                  </button>
                   {currentIndex < quizQuestions.length - 1 ? (
                    <button
                       className="px-3 py-2 border rounded-md bg-black text-white hover:bg-gray-800 cursor-pointer disabled:opacity-50"
                      onClick={() =>
                        setCurrentIndex((i) =>
                          Math.min(quizQuestions.length - 1, i + 1)
                        )
                      }
                       disabled={answers[quizQuestions[currentIndex].id] === undefined}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                       className="px-3 py-2 border rounded-md bg-green-600 text-white hover:bg-green-700 cursor-pointer disabled:opacity-50"
                      onClick={() => {
                        const correct = quizQuestions.reduce(
                          (sum, q) =>
                            sum + (answers[q.id] === q.answerIndex ? 1 : 0),
                          0
                        );
                        setScoreCount(correct);
                        setTimeTakenSec(totalSec - timeLeftSec);
                         setIsTimerRunning(false);
                        setIsSubmitted(true);
                      }}
                       disabled={answers[quizQuestions[currentIndex].id] === undefined}
                    >
                      Submit
                    </button>
                  )}
                </div>
              </div>
            )}

          {/* Kick off generation when needed */}
          {!questions && !quizQuestions && !loadingQuiz && !quizError && (
            <button
              className="mt-2 px-3 py-2 border rounded-md bg-teal-600 text-white hover:bg-teal-700 cursor-pointer disabled:opacity-50"
              onClick={async () => {
                try {
                  if (!Array.isArray(topics) || topics.length === 0)
                    throw new Error("No topics provided for quiz generation");
                  setLoadingQuiz(true);
                  const { questions: q } = await generateQuizFromTopics(topics);
                  setQuizQuestions(q);
                  setQuizError("");
                  setCurrentIndex(0);
                } catch (e) {
                  setQuizError(e.message || "Failed to generate quiz");
                } finally {
                  setLoadingQuiz(false);
                }
              }}
            >
              Generate Questions
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
