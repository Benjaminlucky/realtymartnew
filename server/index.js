"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { connectDB } = require("./config/db");
const { ok, fail } = require("./lib/helpers");

const authRouter = require("./routes/auth");
const landsRouter = require("./routes/lands");
const housesRouter = require("./routes/houses");
const blogRouter = require("./routes/blog");
const miscRouter = require("./routes/misc");

const reviewsRouter = require("./routes/review.js");

const { requireAuth } = require("./middleware/auth");
const authCtrl = require("./controllers/authController");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Connect DB ────────────────────────────────────────────────────
connectDB();

// ── Security ──────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// ── CORS ──────────────────────────────────────────────────────────
const allowed = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  "https://mehurbs.com",
  "https://mehurbs.netlify.app",
];

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowed.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Body ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Static uploads ────────────────────────────────────────────────
app.use(
  "/uploads",
  express.static(path.join(__dirname, process.env.UPLOAD_PATH || "uploads"), {
    maxAge: "1d",
    etag: true,
  }),
);

// ── Rate limiters ─────────────────────────────────────────────────
// Renamed from "auth" to "generalLimiter" / "authLimiter" to avoid
// confusion with the requireAuth middleware
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 500 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for localhost in development
  skip: (req) =>
    process.env.NODE_ENV !== "production" &&
    (req.ip === "127.0.0.1" ||
      req.ip === "::1" ||
      req.ip === "::ffff:127.0.0.1"),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    process.env.NODE_ENV !== "production" &&
    (req.ip === "127.0.0.1" ||
      req.ip === "::1" ||
      req.ip === "::ffff:127.0.0.1"),
  message: {
    success: false,
    message: "Too many login attempts. Try again in 15 minutes.",
  },
});

app.use(generalLimiter);

// ── Health ────────────────────────────────────────────────────────
app.get("/health", (req, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() }),
);

// ── Setup (first-run) — no auth required, anyone can call on fresh install ──
app.get("/setup", authLimiter, authCtrl.setupStatus);
app.post("/setup", authLimiter, authCtrl.setupCreate);

// ── Auth routes (login is public, me/logout need requireAuth inside router) ──
app.use("/auth", authLimiter, authRouter);

// ── Protected + public routes ─────────────────────────────────────
app.use("/lands", landsRouter);
app.use("/houses", housesRouter);
app.use("/blog", blogRouter);
app.use("/", miscRouter);
app.use("/", reviewsRouter);

// ── 404 ───────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  }),
);

// ── Error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.message?.startsWith("CORS:"))
    return res.status(403).json({ success: false, message: err.message });
  if (err.code === "LIMIT_FILE_SIZE")
    return res
      .status(413)
      .json({ success: false, message: "File too large (max 5MB)" });

  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 NaijaRealty API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`   Health:      http://localhost:${PORT}/health\n`);
});

module.exports = app;
