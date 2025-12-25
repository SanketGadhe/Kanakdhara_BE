const mailContent = {
  FinancialHealthMail: {
    subject: "Your Comprehensive Financial Health Quiz Report - Kanakdhara Investments",
    message: "Hi, please find your Kanakdhara Financial Health Report attached."
  },
  GoalCalculatorMail: {
    subject: "Your Goal Calculator Report",
    message: "Hi, please find your Kanakdhara Investment Goal Calculator Report attached."
  },
  RiskProfileMail: {
    subject: "Your Risk Profile Report - Kanakdhara Investments",
    message: "Hi, please find your Kanakdhara Risk Profile Report attached."
  }
};

function buildMeetingEmail(meetingLink) {
  return {
    Subject: "Meeting Confirmed – Kanakdhara Investments",
    Message: `Thank you for scheduling a meeting with us.

Your meeting has been successfully confirmed, and we’re looking forward to our discussion.

Please find the meeting link below:
${meetingLink}

If you need to reschedule or have any queries, feel free to reply to this email or contact us directly.

We look forward to helping you move closer to your financial goals.

Warm regards,
Chetan Joshi, CFP®
Founder & CEO
Kanakdhara Investments`
  };
}

const RISK_ZONES = [
  { label: 'Highly Conservative', color: '#67e8f9' }, // cyan
  { label: 'Conservative', color: '#34d399' },        // emerald
  { label: 'Moderate', color: '#facc15' },            // amber
  { label: 'Aggressive', color: '#fb7185' },          // rose
  { label: 'Very Aggressive', color: '#f87171' }      // red
];

function companyHeaderHtml() {
  return `
  <div class="flex items-center justify-between border-b border-slate-200 pb-6 mb-6">
    <div class="flex items-center gap-4">
      <img 
        src="https://kanakdharainv.com/static/logo-2.png"
        alt="Kanakdhara Investment"
        class="h-12 object-contain"
      />
      <div>
        <h2 class="text-lg font-bold text-slate-900">Kanakdhara Investment</h2>
        <p class="text-xs text-slate-500">Trusted Wealth & Risk Advisory</p>
      </div>
    </div>

    <div class="text-right text-xs text-slate-600 leading-relaxed">
      <p>📞 +91 78903 24370</p>
      <p>✉️ chetan@kanakdharainv.com</p>
      <p>📍 Bengaluru, India</p>
    </div>
  </div>
  `;
}
function gaugeHtmlWithZones(score, max) {
  const angle = Math.min(1, score / max) * 180 - 90;

  const arcPaths = [
    'M30 150 A120 120 0 0 1 78 60',
    'M78 60 A120 120 0 0 1 150 30',
    'M150 30 A120 120 0 0 1 222 60',
    'M222 60 A120 120 0 0 1 270 150'
  ];

  return `
  <div class="relative w-64 h-32 mx-auto my-6">
    <svg viewBox="0 0 300 160" class="w-full h-full">

      ${arcPaths
      .map(
        (d, i) => `
          <path
            d="${d}"
            fill="none"
            stroke="${RISK_ZONES[i].color}"
            stroke-width="24"
            stroke-linecap="round"
          />`
      )
      .join('')}

      <!-- Needle -->
      <g transform="rotate(${angle} 150 150)">
        <path d="M150 150 L150 20"
          stroke="#1e293b"
          stroke-width="6"
          stroke-linecap="round" />
        <circle cx="150" cy="150" r="12" fill="#1e293b" />
        <circle cx="150" cy="150" r="6" fill="#ffffff" />
      </g>
    </svg>

    <div class="absolute -bottom-6 w-full text-center font-bold text-slate-800">
      Score: ${score} / ${max}
    </div>
  </div>
  `;
}
function customerInfoHtml(user) {
  return `
  <div class="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4">
    <h4 class="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">
      Customer Information
    </h4>

    <div class="grid grid-cols-2 gap-2 text-sm">
      <div>
        <p class="text-xs text-slate-400">Name</p>
        <p class="font-bold text-slate-800">${user.name}</p>
      </div>
      <div>
        <p class="text-xs text-slate-400">Age</p>
        <p class="font-bold text-slate-800">${user.age} Years</p>
      </div>
      <div>
        <p class="text-xs text-slate-400">Email</p>
        <p class="font-bold text-slate-800">${user.email}</p>
      </div>
      <div>
        <p class="text-xs text-slate-400">Phone</p>
        <p class="font-bold text-slate-800">${user.phone || '-'}</p>
      </div>
    </div>
  </div>
  `;
}

function generateRiskProfileHtml(payload) {
  const { user, assessment, allocation, keyInputData } = payload;
  return `
<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8" />
                    <script src="https://cdn.tailwindcss.com"></script>
                </head>

                <body class="bg-slate-100 p-6 font-sans">
                    <div class="max-w-3xl mx-auto bg-white rounded-[2.5rem] shadow-xl p-8">

                        ${companyHeaderHtml()}

                        ${customerInfoHtml(user)}

                        <div class="text-center mb-10">
                            <p class="text-slate-500 font-bold text-sm uppercase tracking-wider">
                                Risk Assessment Report
                            </p>
                            <h1 class="text-4xl font-serif font-bold mt-3" style="color:${assessment.profileColor}">
                                ${assessment.profileLabel}
                            </h1>
                        </div>

                        ${gaugeHtmlWithZones(assessment.totalScore, assessment.maxPossible)}

    <div class="grid grid-cols-2 gap-8 mt-12">
      <div>
        <h4 class="font-bold text-slate-900 mb-3 border-b pb-2">
          Investor Persona
        </h4>
        <p class="text-slate-600 text-sm leading-relaxed text-justify">
          ${assessment.profileDescription}
        </p>
      </div>

      <div>
        <h4 class="font-bold text-slate-900 mb-3 border-b pb-2">
          Suggested Asset Allocation
        </h4>

        <div class="bg-slate-50 p-4 rounded-xl border">
          <div class="flex justify-between mb-2 text-sm font-bold">
            <span>${allocation.ageGroup}</span>
            <span class="text-slate-500">${assessment.profileLabel}</span>
          </div>

          <div class="w-full h-3 rounded-full overflow-hidden flex">
            <div class="bg-emerald-500" style="width:${allocation.equity}%"></div>
            <div class="bg-blue-500" style="width:${allocation.debt}%"></div>
            <div class="bg-yellow-400" style="width:${allocation.gold}%"></div>
            <div class="bg-slate-400" style="width:${allocation.cash}%"></div>
          </div>

          <p class="text-xs text-center text-slate-500 mt-3 font-medium">
            Equity ${allocation.equity}% | Debt ${allocation.debt}% |
            Gold ${allocation.gold}% | Cash ${allocation.cash}%
          </p>
        </div>
      </div>
    </div>

    <!-- Key Inputs -->
    <div class="bg-slate-50 rounded-2xl p-6 mt-8 border">
      <h4 class="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">
        Key Inputs
      </h4>

      <div class="grid grid-cols-4 gap-4 text-sm">
        <div>
          <p class="text-xs text-slate-400">Age</p>
          <p class="font-semibold">${keyInputData.age} Years</p>
        </div>
        <div>
          <p class="text-xs text-slate-400">Horizon</p>
          <p class="font-semibold">${keyInputData.horizon}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400">Knowledge</p>
          <p class="font-semibold">${keyInputData.knowledge}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400">Dependents</p>
          <p class="font-bold">${keyInputData.dependents}</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-2 pt-3 border-t text-center">
      <p class="text-[10px] text-slate-400 leading-relaxed">
        Disclaimer: Risk profile assessment is indicative and does not guarantee returns.
        Investments are subject to market risks. Please consult your investment advisor
        before taking any decision.
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

const FINANCIAL_ZONE = [
  { label: 'Excellent', color: '#06b6d4' }, // cyan
  { label: 'Good', color: '#10b981' },      // emerald
  { label: 'Average', color: '#f59e0b' },   // amber
  { label: 'Weak', color: '#f97316' }       // orange
];
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function financialHealthGaugeHtml(score, max) {
  const rotation = Math.min(1, score / max) * 180 - 90;
  const ARC_PATH = 'M 30 150 A 120 120 0 0 1 270 150';
  const ARC_LENGTH = Math.PI * 120; // semicircle length
  const ZONE_COUNT = 4;
  const SEG_LEN = ARC_LENGTH / ZONE_COUNT;


  return `
  <div class="relative w-64 h-32 mx-auto my-6">
    <svg viewBox="0 0 300 160" class="w-full h-full">

      <!-- Base arc -->
      <path
        d="${ARC_PATH}"
        fill="none"
        stroke="#e2e8f0"
        stroke-width="24"
        stroke-linecap="round"
      />

      <!-- Colored Zones (STATIC dash logic) -->
      ${FINANCIAL_ZONE.map((zone, idx) => `
        <path
          d="${ARC_PATH}"
          fill="none"
          stroke="${zone.color}"
          stroke-width="24"
          stroke-linecap="round"
          style="
            stroke-dasharray: ${SEG_LEN} ${ARC_LENGTH};
            stroke-dashoffset: ${-idx * SEG_LEN};
          "
        />
      `).join('')}

      <!-- Needle -->
      <g transform="rotate(${rotation} 150 150)">
        <path
          d="M 150 150 L 150 20"
          stroke="#1e293b"
          stroke-width="6"
          stroke-linecap="round"
        />
        <circle cx="150" cy="150" r="12" fill="#1e293b" />
        <circle cx="150" cy="150" r="6" fill="#ffffff" />
      </g>
    </svg>

    <div class="absolute -bottom-6 w-full text-center font-bold text-slate-800">
      Score: ${score} / ${max}
    </div>
  </div>
  `;
}


function generateFinancialHealthHtml(data) {
  const { user, assessment, keyInputs, investorPersona, actionCanBeTaken } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-slate-100 p-8 font-sans">
  <div class="max-w-3xl mx-auto bg-white rounded-[2.5rem] shadow-xl p-10">

    ${companyHeaderHtml()}

    ${customerInfoHtml(user)}

    <!-- Title -->
    <div class="text-center mb-10">
      <p class="text-slate-500 font-bold text-sm uppercase tracking-wider">
        Financial Health Assessment Report
      </p>
      <h1 class="text-4xl font-serif font-bold mt-3"
        style="color:${assessment.profileColor}">
        ${assessment.profileLabel}
      </h1>
    </div>

    <!-- Gauge -->
    ${financialHealthGaugeHtml(
    assessment.totalScore,
    assessment.maxPossible
  )}

    <!-- Analysis -->
    <div class="grid grid-cols-2 gap-8 mt-12 mb-10">
      <div>
        <h4 class="font-bold text-slate-900 mb-4 pb-2 border-b">
          Investor Persona
        </h4>
        <p class="text-slate-600 text-sm leading-relaxed text-justify">
          ${investorPersona}
        </p>
      </div>

      <div>
        <h4 class="font-bold text-slate-900 mb-4 pb-2 border-b">
          Action Can Be Taken
        </h4>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p class="text-sm text-slate-700">
            ${actionCanBeTaken}
          </p>
        </div>
      </div>
    </div>

    <!-- Key Inputs -->
    <div class="bg-slate-50 rounded-2xl p-6 mb-4 border border-slate-200">
      <h4 class="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">
        Key Inputs
      </h4>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p class="text-xs text-slate-400">Age</p>
          <p class="font-bold">${keyInputs.age} Years</p>
        </div>
        <div>
          <p class="text-xs text-slate-400">Emergency Fund</p>
          <p class="font-bold">${keyInputs.emergencyFund}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400">Savings</p>
          <p class="font-bold">${keyInputs.saving}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400">Market Investment</p>
          <p class="font-bold">${keyInputs.marketInvestment}</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-5 pt-6 border-t text-center">
      <p class="text-[10px] text-slate-400 leading-relaxed max-w-lg mx-auto">
        Disclaimer: Financial health assessment is indicative and does not guarantee returns.
        Investments are subject to market risks. Please consult your investment advisor before taking action.
      </p>
    </div>

  </div>
</body>
</html>
`;
}

function getSubscriptionMailTemplate() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Kanakdhara Investments</title>
</head>

<body style="margin:0; padding:0; background-color:#f5f7fa; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">

  <!-- Outer Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7fa; padding:20px 0;">
    <tr>
      <td align="center">

        <!-- Email Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:24px;">
              <img
                src="https://kanakdharainv.com/static/logo-2.png"
                alt="Kanakdhara Investments"
                style="max-width:180px; height:auto;"
              />
            </td>
          </tr>

          <!-- Welcome -->
          <tr>
            <td style="padding:32px 40px 16px;">
              <h1 style="margin:0 0 12px; font-size:24px; font-weight:700; color:#111827;">
                Welcome to Kanakdhara Investments 👋
              </h1>
              <p style="margin:0; font-size:16px; line-height:1.6; color:#374151;">
                Thank you for subscribing to the <strong>Kanakdhara Investments Newsletter</strong>.
                We’re delighted to have you as part of our growing investor community.
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#374151;">
                Through our newsletter, you’ll receive:
              </p>

              <ul style="margin:0 0 16px 18px; padding:0; font-size:15px; line-height:1.7; color:#374151;">
                <li>Actionable market insights and investment updates</li>
                <li>Practical financial planning and wealth-building strategies</li>
                <li>Expert perspectives on mutual funds, equities, and long-term goals</li>
                <li>Timely updates to help you stay disciplined and informed</li>
              </ul>

              <p style="margin:0; font-size:15px; line-height:1.7; color:#374151;">
                Our goal is simple — to help you make confident, well-informed financial decisions
                aligned with your long-term objectives.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:8px 40px 32px;">
              <a
                href="https://kanakdharainv.com"
                style="display:inline-block; background-color:#111827; color:#ffffff;
                       text-decoration:none; padding:14px 28px; border-radius:6px;
                       font-size:15px; font-weight:600;"
              >
                Explore Kanakdhara Investments
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px; font-size:14px; color:#374151;">
                If you have any questions or would like personalised guidance, feel free to reply to this email.
              </p>
              <p style="margin:0; font-size:14px; color:#374151;">
                Warm regards,<br />
                <strong>Chetan Joshi, CFP®</strong><br />
                Founder & CEO – Kanakdhara Investments
              </p>
            </td>
          </tr>

          <!-- Disclaimer -->
          <tr>
            <td style="padding:16px 40px;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#6b7280;">
                Disclaimer: Investments are subject to market risks. Please read all scheme-related documents carefully.
                This communication is for informational purposes only and does not constitute investment advice.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Container -->

      </td>
    </tr>
  </table>

</body>
</html>
`;
}

module.exports = {
  mailContent,
  generateRiskProfileHtml,
  generateFinancialHealthHtml,
  companyHeaderHtml,
  customerInfoHtml,
  buildMeetingEmail,
  getSubscriptionMailTemplate
};