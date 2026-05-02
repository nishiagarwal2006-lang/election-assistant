// src/routes/google.js
// ============================================================
// Google Services Routes — Search & Translation
// ============================================================

const express = require("express");
const router = express.Router();
const {
  searchElectionNews,
  translateText,
  supportedLanguages,
} = require("../services/googleSearch");

/**
 * GET /api/google/search?q=your+query
 * Search for election news using Google Custom Search
 */
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    if (q.length > 200) {
      return res.status(400).json({
        success: false,
        error: "Search query is too long",
      });
    }

    const results = await searchElectionNews(q.trim());

    return res.json({
      success: true,
      query: q.trim(),
      results: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Search route error:", error);
    return res.status(500).json({
      success: false,
      error: "Search failed. Please try again.",
    });
  }
});

/**
 * POST /api/google/translate
 * Translate text to a target language
 */
router.post("/translate", async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: "Both text and targetLanguage are required",
      });
    }

    // Validate language code
    const validCodes = supportedLanguages.map((l) => l.code);
    if (!validCodes.includes(targetLanguage)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language. Supported codes: ${validCodes.join(", ")}`,
      });
    }

    const result = await translateText(text, targetLanguage);

    return res.json(result);
  } catch (error) {
    console.error("Translate route error:", error);
    return res.status(500).json({
      success: false,
      error: "Translation failed. Please try again.",
    });
  }
});

/**
 * GET /api/google/languages
 * Get list of supported languages
 */
router.get("/languages", (req, res) => {
  return res.json({
    success: true,
    languages: supportedLanguages,
  });
});

module.exports = router;