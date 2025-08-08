const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

function buildPrompt(topics) {
  const topicList = topics.slice(0, 12).join(", ");
  return `You are a senior instructor. Build a beginner-to-intermediate multiple choice quiz strictly in JSON.
Topics: ${topicList}
Return JSON only with this shape:
{
  "questions": [
    {
      "id": "q1",
      "topic": "<one of topics>",
      "level": "beginner|intermediate",
      "question": "text",
      "choices": ["A","B","C","D"],
      "answerIndex": 0,
      "explanation": "why the answer is correct"
    }
  ]
}
Rules:
- 8 to 12 questions total.
- Use clear, concise wording.
- Vary between beginner and intermediate.
- choices length 4.
- Ensure answerIndex is an integer 0-3 and matches choices.
- Do NOT include any prose outside the JSON.`;
}

function extractJson(text) {
  if (!text) return null;
  // Try code fence first
  const fence = text.match(/```json[\s\S]*?```/i) || text.match(/```[\s\S]*?```/);
  let jsonStr = text;
  if (fence) {
    jsonStr = fence[0].replace(/```json|```/g, "").trim();
  }
  // Fallback cleanup of trailing commas
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Attempt to find first JSON object
    const start = jsonStr.indexOf("{");
    const end = jsonStr.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const slice = jsonStr.substring(start, end + 1);
      try { return JSON.parse(slice); } catch {}
    }
    throw new Error("Gemini returned unparsable JSON for quiz");
  }
}

export async function generateQuizFromTopics(topics) {
  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error("No topics provided to generate quiz");
  }
  if (!GEMINI_API_KEY) {
    throw new Error("Missing VITE_GEMINI_API_KEY");
  }

  const prompt = buildPrompt(topics);
  const body = { contents: [{ parts: [{ text: prompt }] }] };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini error ${res.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const parsed = extractJson(text);
  const questions = (parsed?.questions || []).map((q, idx) => ({
    id: q.id || `q${idx + 1}`,
    topic: q.topic || topics[idx % topics.length],
    level: q.level || (idx < parsed.questions.length / 2 ? "beginner" : "intermediate"),
    question: q.question,
    choices: q.choices?.slice(0, 4) || [],
    answerIndex: Number.isInteger(q.answerIndex) ? q.answerIndex : 0,
    explanation: q.explanation || ""
  })).filter(q => q.question && q.choices.length === 4);

  if (questions.length === 0) throw new Error("Quiz generation returned no questions");

  return { questions };
}
