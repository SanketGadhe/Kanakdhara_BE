// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const app = express();

// Trust proxy for deployment platforms (Render, Heroku, etc.)
app.set('trust proxy', 1);

// Security middleware
const rateLimit = require("express-rate-limit");

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for form submissions
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 form submissions per windowMs
  message: {
    error: "Too many form submissions, please try again later."
  }
});

const newsLetter = require("./routes/newsLetter.routes");
/* ======================
   MIDDLEWARE
====================== */
// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const allowedOrigins = [
  "https://kanakdharainv.com",
  "https://www.kanakdharainv.com",
  "http://localhost:3000"
];

// Add localhost only in development
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push("http://localhost:3000");
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

/* ======================
   DATABASE
====================== */
connectDB();

/* ======================
   ROUTES
====================== */
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
/* ======================
   ERROR HANDLING
====================== */
// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

/* ======================
   HEALTH CHECK
====================== */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
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
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('tooManyRequest',
  (req, res) => {
    console.error('Too many requests from this IP, please try again later.');
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.'
    });
  }
)

app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
