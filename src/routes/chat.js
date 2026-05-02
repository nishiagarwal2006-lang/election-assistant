// src/routes/chat.js
// ============================================================
// Chat Routes — Handles AI conversation API endpoints
// Using Google Gemini (Free — no credit card needed)
// ============================================================

const express = require("express");
const router = express.Router();
const { chat, explainStep } = require("../services/llm");

// In-memory session store
// For production, replace with Redis or a database
const sessions = new Map();

/**
 * POST /api/chat
 * Main chat endpoint — sends a message and gets AI response
 */
router.post("/", async (req, res) => {
  try {
    const { message, sessionId, userContext } = req.body;

    // Validate input
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required and must be a string",
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Message cannot be empty",
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: "Message is too long. Please keep it under 2000 characters.",
      });
    }

    // Get or create conversation history for this session
    const history = sessions.get(sessionId) || [];

    // Call the LLM service
    const result = await chat(history, message.trim(), userContext);

    if (!result.success) {
      return res.status(500).json(result);
    }

    // Save updated history (keep last 20 messages to manage token usage)
    const trimmedHistory = result.updatedHistory.slice(-20);
    sessions.set(sessionId, trimmedHistory);

    // Auto-cleanup old sessions after 30 minutes of inactivity
    setTimeout(() => {
      if (sessions.has(sessionId)) {
        sessions.delete(sessionId);
      }
    }, 30 * 60 * 1000);

    return res.json({
      success: true,
      message: result.message,
      sessionId: sessionId,
    });
  } catch (error) {
    console.error("Chat route error:", error);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred. Please try again.",
    });
  }
});

/**
 * POST /api/chat/explain-step
 * Explains a specific step in the voter journey
 */
router.post("/explain-step", async (req, res) => {
  try {
    const { stepNumber } = req.body;

    if (!stepNumber || stepNumber < 1 || stepNumber > 6) {
      return res.status(400).json({
        success: false,
        error: "Step number must be between 1 and 6",
      });
    }

    const result = await explainStep(Number(stepNumber));

    return res.json(result);
  } catch (error) {
    console.error("Explain step error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to explain step. Please try again.",
    });
  }
});

/**
 * DELETE /api/chat/clear
 * Clear conversation history for a session
 */
router.delete("/clear", (req, res) => {
  const { sessionId } = req.body;

  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
  }

  return res.json({
    success: true,
    message: "Conversation cleared successfully",
  });
});

module.exports = router;


