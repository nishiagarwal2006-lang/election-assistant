// src/services/googleSearch.js
// ============================================================
// Google Services — Custom Search & Translation
// ============================================================

const axios = require("axios");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

/**
 * Search for election-related news and information using Google Custom Search
 * @param {string} query - Search term
 * @param {number} numResults - Number of results to return (max 10)
 * @returns {Array} - Array of search results
 */
async function searchElectionNews(query, numResults = 5) {
  try {
    // Append "election" to the query to keep results relevant
    const fullQuery = `${query} election`;

    const response = await axios.get(
      "https://www.googleapis.com/customsearch/v1",
      {
        params: {
          key: GOOGLE_API_KEY,
          cx: SEARCH_ENGINE_ID,
          q: fullQuery,
          num: numResults,
          safe: "active", // Safe search enabled for public use
          dateRestrict: "m3", // Results from last 3 months for recency
        },
        timeout: 5000, // 5 second timeout
      }
    );

    if (!response.data.items) {
      return [];
    }

    // Format results cleanly
    return response.data.items.map((item) => ({
      title: item.title,
      snippet: item.snippet,
      url: item.link,
      source: item.displayLink,
      thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src || null,
    }));
  } catch (error) {
    console.error("Google Search Error:", error.message);
    return [];
  }
}

/**
 * Translate text using Google Cloud Translation API
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (e.g., 'hi', 'es', 'fr')
 * @returns {Object} - Translated text
 */
async function translateText(text, targetLanguage) {
  try {
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2`,
      {
        q: text,
        target: targetLanguage,
        format: "text",
      },
      {
        params: { key: GOOGLE_API_KEY },
        timeout: 5000,
      }
    );

    const translated =
      response.data.data.translations[0].translatedText;
    const detectedLanguage =
      response.data.data.translations[0].detectedSourceLanguage;

    return {
      success: true,
      translatedText: translated,
      detectedSourceLanguage: detectedLanguage,
      targetLanguage: targetLanguage,
    };
  } catch (error) {
    console.error("Google Translate Error:", error.message);
    return {
      success: false,
      error: "Translation failed. Please try again.",
    };
  }
}

/**
 * Supported languages for translation
 */
const supportedLanguages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
];

module.exports = { searchElectionNews, translateText, supportedLanguages };