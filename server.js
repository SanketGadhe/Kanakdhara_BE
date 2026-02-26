// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

const app = express();

// Trust proxy for deployment platforms (Render, Heroku, etc.)
app.set('trust proxy', 1);

// =====================================================
// CORS MUST be FIRST — before rate limiter!
// If rate limiter responds before CORS, browsers silently
// drop the response (no Access-Control-Allow-Origin header).
// This causes "provisional headers shown" + empty response.
// =====================================================
const allowedOrigins = [
  "https://kanakdharainv.com",
  "https://www.kanakdharainv.com",
  "https://admin.kanakdharainv.com"
  // NOTE: Origins never include paths. The page URL
  // https://kanakdharainv.com/836defd4-... sends origin
  // https://kanakdharainv.com (already listed above).
];

// Add localhost in development
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push("http://localhost:3000");
  allowedOrigins.push("http://localhost:5173");
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// =====================================================
// Rate Limiting (AFTER CORS so blocked responses still
// have CORS headers and browsers can read them)
// =====================================================
const rateLimit = require("express-rate-limit");

// Accept both 'development' and legacy 'devlopment' typo in .env
const isDevOrTest = ['development', 'devlopment'].includes(process.env.NODE_ENV);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevOrTest ? 1000 : 500,
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Don't count OPTIONS preflight requests against the limit
  skip: (req) => req.method === 'OPTIONS',
});
app.use(limiter);

// Stricter rate limiting for form submissions
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevOrTest ? 1000 : 50,
  message: {
    error: "Too many form submissions, please try again later."
  },
  // Don't count OPTIONS preflight against form limit
  skip: (req) => req.method === 'OPTIONS',
});

const newsLetter = require("./routes/newsLetter.routes");

/* ======================
   MIDDLEWARE
====================== */
// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

/* ======================
   DATABASE
====================== */
connectDB();

/* ======================
   HEALTH CHECK (before routes so it's always reachable)
====================== */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/* ======================
   ROUTES
====================== */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Kanakdhara Backend",
    env: process.env.NODE_ENV || "production"
  });
});

// Public routes
app.use("/api/leads/customerInfo", require("./routes/customerInfo.routes"));
app.use("/api/overall", require("./routes/marketData.routes"));
app.use("/api/reports", require("./routes/report.routes"));
app.use("/api/reports", require("./routes/goalReports.routes"));
app.use("/api/calendar", require("./routes/calendar.routes"));
app.use("/api", require("./routes/auth.routes"));
app.use("/api", formLimiter, require("./routes/iisForm.routes"));
app.use("/api/market", require("./routes/market.routes"));
app.use("/api/newsletter", formLimiter, newsLetter);
app.use("/api/market-mood", require("./routes/marketMoodIndicator.routes"));
app.use("/api/job", formLimiter, require("./routes/jobApplication.routes"));

// Admin routes
app.use("/api", require("./routes/adminAuth.routes"));
app.use("/api/leads/activity", require("./routes/activity.routes"));
app.use("/api/blog", require("./routes/blog.routes"));
app.use("/api/documents", require("./routes/document.routes"));
app.use("/api/mail", require("./routes/mail.routes"));

/* ======================
   ERROR HANDLING
====================== */
// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler (must have 4 params for Express to treat it as error middleware)
app.use((err, req, res, next) => {
  console.error('Global error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 4000;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Prevent server from crashing on unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // In production, log but don't crash for recoverable errors
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
