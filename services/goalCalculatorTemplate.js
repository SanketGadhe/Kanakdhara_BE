// goalCalculatorReportTemplate.js
// const logoUrl = "../static/logo-2.png";
function renderGoalCalculatorReportHTML(data) {
  const {
    customer,
    goalData
  } = data;
  const { clientName, clientEmail, clientPhone, clientAddress } = {
    "clientName": "Kanakdhara Investment",
    "phclientPhoneone": "+91 78903 24370",
    "clientEmail": "chetan@kanakdharainv.com",
    "clientAddress": "Bengaluru, India"
  }
  const {
    name: customerName,
    email: customerEmail,
    reportDate,
  } = customer || {};
  const {
    monthlyInvestment,
    durationYears,
    returnRate,
    investedAmount,
    estimatedReturns,
    totalValue
  } = goalData || {};
  const clientLogoUrl = "http://localhost:4000/logo.png";
  console.log("Goal Data:", goalData);
  console.log("Rendering report for:", customerName, clientName, monthlyInvestment, durationYears, returnRate);
  // Donut chart numbers (server-side)
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const investedShare =
    totalValue && totalValue > 0
      ? Math.min(100, Math.max(0, (investedAmount / totalValue) * 100))
      : 0;
  const strokeDasharray = circumference.toFixed(2);
  const strokeDashoffset = (
    ((100 - investedShare) / 100) *
    circumference
  ).toFixed(2);

  const formatINR = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${clientName} – Goal Calculator Report</title>

  <!-- Tailwind via CDN (for PDF via headless browser) -->
  <script src="https://cdn.tailwindcss.com"></script>

  <style>
    /* Brand color variables — use these instead of relying only on utility classnames */
    .report-root {
      --brand-50: #ecfdf3;
      --brand-300: #6ee7b7;
      --brand-400: #34d399;
      --brand-500: #22c55e;
      --brand-500-10: rgba(34,197,94,0.1);
      --brand-500-20: rgba(34,197,94,0.2);
      --brand-600: #16a34a;
      --brand-700: #15803d;
      --brand-900-20: rgba(6,95,70,0.2);
    }

    /* Keep the original utility names working but map them to variables.
       Note: classnames containing slashes need escaping in CSS selectors. */
    .bg-brand-500 { background-color: var(--brand-500); }
    .text-brand-500 { color: var(--brand-500); }
    .text-brand-300 { color: var(--brand-300); }
    .bg-brand-900\/20 { background-color: var(--brand-900-20); }
    .border-brand-500\/20 { border-color: var(--brand-500-20); }
    .bg-brand-50 { background-color: var(--brand-50); }
    .text-brand-600 { color: var(--brand-600); }
    .bg-brand-600 { background-color: var(--brand-600); }
    .hover\:bg-brand-700:hover { background-color: var(--brand-700); }
    .shadow-brand-500\/20 { box-shadow: 0 16px 30px var(--brand-500-20); }

    /* Additional selectors commonly used in template (gaps between Tailwind and static rendering) */
    .bg-brand-500\/10 { background-color: var(--brand-500-10); }
    .text-brand-400 { color: var(--brand-400); }

    /* For PDF consistency, A4 & tighter margins */
    @page { 
      size: A4;
      margin: 10mm;
    }

    body { 
      margin: 0; 
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; 
      font-size: 13px;
    }

    /* Slight global scale down to be safe */
    .report-root {
      transform: scale(0.92);
      transform-origin: top left;
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-900">
  <div class="report-root max-w-5xl mx-auto px-4 py-4">
    <!-- Header: Logo on right, company name, contact details -->
    <header class="flex items-start justify-between border-b border-slate-200 pb-3 mb-4">
      <div class="space-y-1">
        <h1 class="text-xl font-bold tracking-tight">${clientName}</h1>
        <div class="text-xs text-slate-600 leading-relaxed">
          ${clientPhone ? `<div><span class="font-semibold">Phone:</span> ${clientPhone}</div>` : ""}
          ${clientEmail ? `<div><span class="font-semibold">Email:</span> ${clientEmail}</div>` : ""}
          ${clientAddress ? `<div><span class="font-semibold">Address:</span> ${clientAddress}</div>` : ""}
        </div>
      </div>

      <div class="flex flex-col items-end gap-1">
        ${clientLogoUrl
      ? `<img src="${clientLogoUrl}" alt="${clientName} Logo" class="h-12 object-contain" />`
      : ""
    }
      </div>
    </header>

    <!-- Customer details block -->
    <section class="bg-white rounded-2xl border border-slate-200 p-3 mb-4">
      <h2 class="text-base font-semibold mb-2">Customer Details</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div>
          <div class="text-slate-500 text-[10px] uppercase font-semibold mb-1">Customer Name</div>
          <div class="font-medium">${customerName || "-"}</div>
        </div>
        <div>
          <div class="text-slate-500 text-[10px] uppercase font-semibold mb-1">Email</div>
          <div class="font-medium">${customerEmail || "-"}</div>
        </div>
        <div>
          <div class="text-slate-500 text-[10px] uppercase font-semibold mb-1">Report Date</div>
          <div class="font-medium">${reportDate || "-"}</div>
        </div>
      </div>
    </section>

    <!-- Goal Calculator Section (static, PDF-friendly version) -->
    <section class="max-w-7xl mx-auto mt-2 relative z-20">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col lg:flex-row">
        <!-- Visual Side (Left) -->
        <div class="lg:w-5/12 bg-slate-900 p-6 text-white flex flex-col justify-between relative overflow-hidden">
          <div class="absolute top-0 right-0 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div>
            <h3 class="text-lg font-bold mb-1">Projected Growth</h3>
            <p class="text-slate-400 text-xs">See how your money works for you.</p>
          </div>

          <div class="flex flex-col items-center justify-center py-4">
            <!-- Donut Chart (SVG, no JS required) -->
            <div class="relative w-48 h-48">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 220 220">
                <circle
                  cx="110" cy="110" r="${radius}"
                  stroke="currentColor" stroke-width="18"
                  fill="transparent"
                  class="text-slate-800"
                />
                <circle
                  cx="110" cy="110" r="${radius}"
                  stroke="currentColor" stroke-width="18"
                  fill="transparent"
                  stroke-dasharray="${strokeDasharray}"
                  stroke-dashoffset="${strokeDashoffset}"
                  stroke-linecap="round"
                  class="text-brand-500"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wide mb-1">Total Corpus</span>
                <span class="text-2xl font-bold text-white tracking-tight">
                  ₹${formatINR(totalValue)}
                </span>
                <span class="mt-1 text-[10px] text-slate-400">
                  Invested ~ ${investedShare.toFixed(0)}% of corpus
                </span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mt-2">
            <div class="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
              <div class="flex items-center gap-2 mb-1">
                <div class="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                <span class="text-[10px] text-slate-400 font-bold uppercase">Invested</span>
              </div>
              <p class="text-base font-bold">₹${formatINR(investedAmount)}</p>
            </div>
            <div class="bg-brand-900/20 rounded-xl p-3 border border-brand-500/20">
              <div class="flex items-center gap-2 mb-1">
                <div class="w-2.5 h-2.5 rounded-full bg-brand-500"></div>
                <span class="text-[10px] text-brand-300 font-bold uppercase">Gains</span>
              </div>
              <p class="text-base font-bold text-brand-400">+₹${formatINR(estimatedReturns)}</p>
            </div>
          </div>
        </div>

        <!-- Input Side (Right) – rendered as read-only summary in PDF -->
        <div class="lg:w-7/12 p-6 bg-white">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-slate-900">Plan Summary</h3>
            <span class="text-[10px] text-slate-400 uppercase tracking-wide">Goal Calculator Report</span>
          </div>

          <div class="space-y-4 text-xs">
            <!-- Monthly Investment -->
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Monthly Investment</span>
                <span class="text-lg font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-lg">
                  ₹ ${formatINR(monthlyInvestment)}
                </span>
              </div>
              <p class="text-[10px] text-slate-400 mt-1">
                Regular SIP amount you plan to invest every month.
              </p>
            </div>

            <!-- Duration -->
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Duration (Years)</span>
                <span class="text-lg font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                  ${durationYears || 0} Yrs
                </span>
              </div>
              <p class="text-[10px] text-slate-400 mt-1">
                Investment horizon considered for this projection.
              </p>
            </div>

            <!-- Rate -->
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Expected Return Rate (p.a)</span>
                <span class="text-lg font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                  ${returnRate || 0} %
                </span>
              </div>
              <p class="text-[10px] text-slate-400 mt-1">
                Assumed annual rate of return used to compute future value.
              </p>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div class="text-[10px] text-slate-400 max-w-[240px]">
              *Projections are illustrative and based on assumed rates. Actual returns may vary based on market conditions.
            </div>
            <div class="px-5 py-2 bg-brand-600 text-white rounded-lg font-bold shadow-xl shadow-brand-500/20 text-[10px] uppercase tracking-wide">
              ${clientName}
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</body>
</html>`;
}

// Example: wrapper by templateId
function renderReportByTemplateId(templateId, data) {
  if (templateId === 'goal-calculator-report') {
    return renderGoalCalculatorReportHTML(data);
  }
  throw new Error("Unknown template id");
}

module.exports = {
  renderGoalCalculatorReportHTML,
  renderReportByTemplateId,
};
