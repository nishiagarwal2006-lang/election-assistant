// src/server.js
// ============================================================
// ElectionIQ — Main Server Entry Point
// ============================================================

// Load environment variables FIRST — before anything else
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

// Import routes
const chatRoutes = require("./routes/chat");
const googleRoutes = require("./routes/google");
const electionData = require("./data/electionData");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Helmet adds important HTTP security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled to allow inline scripts in HTML
  })
);

// CORS — Allow requests from the frontend
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:3000",
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// Rate limiting — prevent API abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: "Too many requests. Please wait 15 minutes before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for chat
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  message: {
    success: false,
    error: "You're sending messages too quickly. Please slow down.",
  },
});

app.use("/api/", limiter);
app.use("/api/chat", chatLimiter);

// ============================================================
// BODY PARSING MIDDLEWARE
// ============================================================

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ============================================================
// STATIC FILES — Serve the frontend
// ============================================================

app.use(express.static(path.join(__dirname, "../public")));

// ============================================================
// API ROUTES
// ============================================================

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ElectionIQ is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      llm: !!process.env.GROQ_API_KEY,      // ✅ changed from ANTHROPIC_API_KEY
      google: !!process.env.GROQ_API_KEY,
    },
  });
});

// Election data endpoint
app.get("/api/election-data", (req, res) => {
  res.json({
    success: true,
    voterJourney: electionData.voterJourney,
    faq: electionData.faq,
    glossary: Object.keys(electionData.glossary).map((key) => ({
      term: key.replace(/_/g, " "),
      definition: electionData.glossary[key],
    })),
  });
});

// Mount route modules
app.use("/api/chat", chatRoutes);
app.use("/api/google", googleRoutes);

// ============================================================
// FRONTEND FALLBACK — Send index.html for all other routes
// ============================================================

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({
    success: false,
    error: "Something went wrong on our end. Please try again later.",
  });
});

// ============================================================
// START SERVER
// ============================================================

// ✅ Changed: now checks GROQ_API_KEY instead of ANTHROPIC_API_KEY
const requiredEnvVars = ["GROQ_API_KEY"];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingVars.join(", ")}`
  );
  console.error("Please check your .env file.");
  process.exit(1);
}

app.listen(PORT, () => {
  console.log("============================================");
  console.log(`🗳️  ElectionIQ is running!`);
  console.log(`🌐  Open: http://localhost:${PORT}`);
  console.log(`📡  Environment: ${process.env.NODE_ENV}`);
  console.log(`🤖  Gemini AI: ${process.env.GROQ_API_KEY ? "✅ Connected" : "❌ Missing key"}`);
  console.log(`🔍  Google Search: ${process.env.GROQ_API_KEY ? "✅ Connected" : "⚠️ Missing key"}`);
  console.log("============================================");
});

module.exports = app;