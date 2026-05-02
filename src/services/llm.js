// src/services/llm.js
// ============================================================
// LLM Service — Groq AI (Free — no credit card needed)
// Get your free key at: https://console.groq.com
// ============================================================

const electionData = require("../data/electionData");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile"; // Free, fast, very capable

// ============================================================
// Helper: Call Groq API
// ============================================================
async function callGroq(messages, systemPrompt) {
  if (!GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is missing from your .env file. Get a free key at console.groq.com"
    );
  }

  const { default: fetch } = await import("node-fetch");

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const err = new Error(data?.error?.message || `HTTP ${response.status}`);
    err.status = response.status;
    throw err;
  }

  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("Groq returned an empty response");
  }

  const usage = {
    input_tokens: data?.usage?.prompt_tokens || 0,
    output_tokens: data?.usage?.completion_tokens || 0,
  };

  return { text, usage };
}

// ============================================================
// chat() — Main conversation function
// Same inputs and return shape as before — nothing else changes
// ============================================================
async function chat(conversationHistory, userMessage, userContext = "") {
  try {
    const systemPrompt =
      electionData.systemPrompt +
      (userContext
        ? `\n\nUser context: This user has identified themselves as: ${userContext}. Tailor your responses accordingly.`
        : "");

    const messages = [
      ...conversationHistory,
      {
        role: "user",
        content: userMessage,
      },
    ];

    const { text: assistantMessage, usage } = await callGroq(messages, systemPrompt);

    return {
      success: true,
      message: assistantMessage,
      updatedHistory: [
        ...messages,
        {
          role: "assistant",
          content: assistantMessage,
        },
      ],
      usage: {
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
      },
    };
  } catch (error) {
    console.error("LLM Service Error:", error.message);

    if (error.status === 401 || error.status === 403) {
      return {
        success: false,
        error: "Invalid API key. Please check your GROQ_API_KEY in the .env file.",
      };
    }

    if (error.status === 429) {
      return {
        success: false,
        error: "Rate limit reached. Please wait a moment before sending another message.",
      };
    }

    return {
      success: false,
      error: "Failed to get a response. Please try again.",
    };
  }
}

// ============================================================
// explainStep() — Explains a specific voter journey step
// ============================================================
async function explainStep(stepNumber) {
  const step = electionData.voterJourney.find((s) => s.step === stepNumber);

  if (!step) {
    return { success: false, error: "Invalid step number" };
  }

  const prompt = `Explain Step ${step.step} of the voter journey: "${step.title}" in a friendly, encouraging way.
  
  Include:
  - Why this step matters
  - Exactly what to do
  - Common mistakes to avoid
  - A helpful tip for first-time voters
  
  Keep it under 200 words and use simple language.`;

  return await chat([], prompt);
}

module.exports = { chat, explainStep };