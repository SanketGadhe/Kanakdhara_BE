// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");
require("dotenv").config();
const path = require("path");
const app = express();
const staticPath = path.join(__dirname, 'public');
app.use(cors());
app.use(bodyParser.json());
connectDB();


// Serve static files from the "public" directory
app.use(express.static(staticPath));

app.use('/api/leads/customerInfo', require('./routes/customerInfo.routes.js'));
app.use("/api/overall", require("./routes/marketData.routes.js"));
app.use("/api/reports", require("./routes/report.routes.js"));
app.use("/api/reports/", require("./routes/goalReports.routes.js"));
app.use("/api/calendar", require("./routes/calendar.routes.js"));
app.use("/api", require('./routes/auth.routes.js'))
app.use("/api", require("./routes/iisForm.routes.js"))

const PORT = process.env.PORT || 4000;
const { getOwnerGoogleTokens } = require('./utils/getOwnerGoogleTokens');
const { generateAuthUrl } = require('./utils/googleAuth');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} url=http://localhost:${PORT}`);
  // On first start, if tokens are not present, print the one-time auth URL
  const tokens = getOwnerGoogleTokens();
  if (!tokens || !tokens.refresh_token) {
    const url = generateAuthUrl();
    console.log('No owner refresh token found. To authorize the owner account, open:');
    console.log(`  Visit: http://localhost:${PORT.replace ? PORT.replace : PORT}${'/api/google'}`);
    console.log('Or open the direct Google consent URL:');
    console.log(`  ${url}`);
    console.log('After consenting, Google will redirect to /api/google/callback which will save the tokens.');
  }
});
