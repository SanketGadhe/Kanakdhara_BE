// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const app = express();

const newsLetter = require("./routes/newsLetter.routes")
/* ======================
   MIDDLEWARE
====================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "https://kanakdharainv.com",
      "https://www.kanakdharainv.com",
      "http://localhost:3000"
    ],
    credentials: true,
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
app.use("/api", require("./routes/iisForm.routes"));
app.use("/api/market", require("./routes/market.routes"));
app.use("/api/newsletter", newsLetter);

/* ======================
   HEALTH CHECK
====================== */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
});
