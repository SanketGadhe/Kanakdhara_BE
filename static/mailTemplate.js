function getContactMailTemplate({
  name = "Investor",
  email = "",
  phone = "",
  message = ""
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>We’ve Received Your Message | Kanakdhara Investments</title>
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

          <!-- Title -->
          <tr>
            <td style="padding:32px 40px 16px;">
              <h1 style="margin:0 0 12px; font-size:24px; font-weight:700; color:#111827;">
                Thank you for reaching out 👋
              </h1>
              <p style="margin:0; font-size:16px; line-height:1.6; color:#374151;">
                Dear <strong>${name}</strong>,<br /><br />
                We’ve received your message and appreciate you getting in touch with
                <strong>Kanakdhara Investments</strong>.
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#374151;">
                One of our team members will review your query and get back to you shortly.
                We aim to respond within <strong>1–2 business days</strong>.
              </p>

              <p style="margin:0 0 12px; font-size:15px; line-height:1.7; color:#374151;">
                <strong>Your submitted details:</strong>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; color:#374151;">
                <tr>
                  <td style="padding:6px 0;"><strong>Email:</strong></td>
                  <td style="padding:6px 0;">${email}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;"><strong>Phone:</strong></td>
                  <td style="padding:6px 0;">${phone}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; vertical-align:top;"><strong>Message:</strong></td>
                  <td style="padding:6px 0;">${message}</td>
                </tr>
              </table>

              <p style="margin:16px 0 0; font-size:15px; line-height:1.7; color:#374151;">
                Meanwhile, feel free to explore our insights, philosophy, and offerings on our website.
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
                Visit Kanakdhara Investments
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px; font-size:14px; color:#374151;">
                If your query is urgent, you may reply to this email directly.
              </p>
              <p style="margin:0; font-size:14px; color:#374151;">
                Warm regards,<br />
                <strong>Chetan Joshi, CFP®</strong><br />
                Founder & CEO – Kanakdhara Investments<br/>
                Phone - +91 7890324370
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
function getJoinTeamMailTemplate({
  name = "Candidate",
  email = "",
  phone = "",
  position = "",
  message = ""
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Received | Kanakdhara Investments</title>
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

          <!-- Title -->
          <tr>
            <td style="padding:32px 40px 16px;">
              <h1 style="margin:0 0 12px; font-size:24px; font-weight:700; color:#111827;">
                Thank you for your interest in joining us 👋
              </h1>
              <p style="margin:0; font-size:16px; line-height:1.6; color:#374151;">
                Dear <strong>${name}</strong>,<br /><br />
                We appreciate you taking the time to apply to
                <strong>Kanakdhara Investments</strong>.
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#374151;">
                Your application has been received and is currently under review by our team.
                If your profile aligns with our requirements, we will get in touch with you.
              </p>

              <p style="margin:0 0 12px; font-size:15px; line-height:1.7; color:#374151;">
                <strong>Application details:</strong>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; color:#374151;">
                <tr>
                  <td style="padding:6px 0;"><strong>Applied Position:</strong></td>
                  <td style="padding:6px 0;">${position}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;"><strong>Email:</strong></td>
                  <td style="padding:6px 0;">${email}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;"><strong>Phone:</strong></td>
                  <td style="padding:6px 0;">${phone}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; vertical-align:top;"><strong>Message:</strong></td>
                  <td style="padding:6px 0;">${message}</td>
                </tr>
              </table>

              <p style="margin:16px 0 0; font-size:15px; line-height:1.7; color:#374151;">
                At Kanakdhara Investments, we value integrity, long-term thinking, and a client-first mindset.
                We look forward to learning more about you.
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
                Learn About Our Firm
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px; font-size:14px; color:#374151;">
                Please note that only shortlisted candidates will be contacted.
              </p>
              <p style="margin:0; font-size:14px; color:#374151;">
                Warm regards,<br />
                <strong>Team Kanakdhara Investments</strong>
              </p>
            </td>
          </tr>

          <!-- Disclaimer -->
          <tr>
            <td style="padding:16px 40px;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#6b7280;">
                Disclaimer: This email is an acknowledgement of your application and does not constitute
                an offer of employment. All applications are reviewed based on current requirements.
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
function getRiskProfileSubmissionMailTemplate({
  name = "Investor",
  email = "",
  assessmentDate = ""
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Risk Profile Assessment Received | Kanakdhara Investments</title>
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

          <!-- Title -->
          <tr>
            <td style="padding:32px 40px 16px;">
              <h1 style="margin:0 0 12px; font-size:24px; font-weight:700; color:#111827;">
                Risk Profile Questionnaire Submitted ✅
              </h1>
              <p style="margin:0; font-size:16px; line-height:1.6; color:#374151;">
                Dear <strong>${name}</strong>,<br /><br />
                Thank you for completing and submitting your <strong>Risk Profile Questionnaire</strong>
                with Kanakdhara Investments.
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#374151;">
                We have successfully received your responses. A copy of your result
                has been attached to this email for your records.
              </p>

              <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#374151;">
                Your risk profile helps us better understand your:
              </p>

              <ul style="margin:0 0 16px 18px; padding:0; font-size:15px; line-height:1.7; color:#374151;">
                <li>Risk tolerance and investment behaviour</li>
                <li>Return expectations and time horizon</li>
                <li>Ability to withstand market volatility</li>
                <li>Suitability for different asset classes</li>
              </ul>

              <p style="margin:0; font-size:15px; line-height:1.7; color:#374151;">
                This assessment will be used as an important input while aligning your investments
                with your financial goals and long-term objectives.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px; font-size:14px; color:#374151;">
                <tr>
                  <td style="padding:6px 0;"><strong>Email:</strong></td>
                  <td style="padding:6px 0;">${email}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;"><strong>Assessment Date:</strong></td>
                  <td style="padding:6px 0;">${assessmentDate}</td>
                </tr>
              </table>

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
                Explore Our Investment Philosophy
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px; font-size:14px; color:#374151;">
                If you have any questions regarding your risk assessment, feel free to reply to this email.
              </p>
              <p style="margin:0; font-size:14px; color:#374151;">
                Warm regards,<br />
                <strong>Chetan Joshi, CFP®</strong><br />
                Founder & CEO – Kanakdhara Investments<br/>
                Phone - +91 7890324370
              </p>
            </td>
          </tr>

          <!-- Disclaimer -->
          <tr>
            <td style="padding:16px 40px;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#6b7280;">
                Disclaimer: Risk profiling is a dynamic process and may change based on personal circumstances,
                financial goals, and market conditions. This assessment alone does not constitute investment advice.
                Investments are subject to market risks. Please read all scheme-related documents carefully.
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
function getFinancialHealthQuizMailTemplate({
  name = "Participant",
  email = "",
  assessmentDate = ""
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Financial Health Quiz Completed | Kanakdhara Investments</title>
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

          <!-- Title -->
          <tr>
            <td style="padding:32px 40px 16px;">
              <h1 style="margin:0 0 12px; font-size:24px; font-weight:700; color:#111827;">
                Financial Health Quiz Completed ✅
              </h1>
              <p style="margin:0; font-size:16px; line-height:1.6; color:#374151;">
                Dear <strong>${name}</strong>,<br /><br />
                Thank you for completing the <strong>Financial Health Quiz</strong>
                with us. Your Result report is attached below.
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#374151;">
                Your responses have been successfully recorded. This quiz is designed to provide
                a high-level view of your current financial well-being across key areas of personal finance.
              </p>

              <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#374151;">
                The assessment broadly reviews:
              </p>

              <ul style="margin:0 0 16px 18px; padding:0; font-size:15px; line-height:1.7; color:#374151;">
                <li>Cash flow and budgeting habits</li>
                <li>Savings and emergency preparedness</li>
                <li>Insurance and risk management basics</li>
                <li>Investment awareness and long-term planning</li>
                <li>Debt and liability management</li>
              </ul>

              <p style="margin:0; font-size:15px; line-height:1.7; color:#374151;">
                This quiz is an educational starting point and helps identify areas that may need
                attention as part of a structured financial planning process.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px; font-size:14px; color:#374151;">
                <tr>
                  <td style="padding:6px 0;"><strong>Email:</strong></td>
                  <td style="padding:6px 0;">${email}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;"><strong>Assessment Date:</strong></td>
                  <td style="padding:6px 0;">${assessmentDate}</td>
                </tr>
              </table>

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
                Learn About Financial Planning
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px; font-size:14px; color:#374151;">
                If you have questions about your quiz results or wish to explore structured financial planning,
                you may reply to this email.
              </p>
              <p style="margin:0; font-size:14px; color:#374151;">
                Warm regards,<br />
                <strong>Chetan Joshi, CFP®</strong><br />
                Founder & CEO – Kanakdhara Investments<br/>
                Phone - +91 7890324370
              </p>
            </td>
          </tr>

          <!-- Disclaimer -->
          <tr>
            <td style="padding:16px 40px;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#6b7280;">
                Disclaimer: The Financial Health Quiz is a self-assessment tool intended for educational purposes only.
                It does not constitute financial advice or a recommendation of any investment product.
                Investments are subject to market risks. Please read all scheme-related documents carefully.
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
function getBookFreeSessionMailTemplate({
  name = "Investor",
  email = "",
  preferredDate = "",
  meetingLink = "",
}) {


  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Free Session Request Received | Kanakdhara Investments</title>
</head>

<body style="margin:0; padding:0; background-color:#f5f7fa; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7fa; padding:20px 0;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05);">

<tr>
<td align="center" style="padding:24px;">
<img src="https://kanakdharainv.com/static/logo-2.png" alt="Kanakdhara Investments" style="max-width:180px;" />
</td>
</tr>

<tr>
<td style="padding:32px 40px 16px;">
<h1 style="margin:0 0 12px; font-size:24px; font-weight:700;">
Your Free Session Request Is Confirmed ✅
</h1>
<p style="font-size:16px; line-height:1.6;">
Dear <strong>${name}</strong>,<br><br>
Thank you for booking a <strong>free introductory session</strong> with Kanakdhara Investments.
</p>
</td>
</tr>

<tr>
<td style="padding:0 40px 24px;">
<p style="font-size:15px; line-height:1.7;">
We’ve received your request and will confirm the session details shortly.
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
<tr>
<td><strong>Email:</strong></td>
<td>${email}</td>
</tr>
<tr>
<td><strong>Preferred Date:</strong></td>
<td>${preferredDate}</td>
</tr>
</table>
</td>
</tr>

 <!-- Meeting Link Section -->
      <tr>
        <td style="padding:0 40px 24px;">
          <p style="margin:0 0 12px; font-size:15px; line-height:1.7; color:#374151;">
            <strong>Your meeting link:</strong>
          </p>

          <p style="margin:0 0 20px; font-size:14px; word-break:break-all;">
            <a href="${meetingLink}" style="color:#2563eb; text-decoration:underline;">
              ${meetingLink}
            </a>
          </p>

          <div style="text-align:center;">
            <a
              href="${meetingLink}"
              style="display:inline-block; background-color:#2563eb; color:#ffffff;
                     text-decoration:none; padding:14px 32px; border-radius:6px;
                     font-size:15px; font-weight:600;"
            >
              Join Your Free Session
            </a>
          </div>
        </td>
      </tr>
<tr>
<td style="padding:24px 40px; background-color:#f9fafb;">
<p style="font-size:14px;">
Warm regards,<br>
<strong>Chetan Joshi, CFP®</strong><br>
Founder & CEO – Kanakdhara Investments<br/>
Phone - +91 7890324370
</p>
</td>
</tr>

<tr>
<td style="padding:16px 40px;">
<p style="font-size:12px; color:#6b7280;">
Disclaimer: This session is introductory and does not constitute investment advice.
</p>
</td>
</tr>

</table>
</td>
</tr>
</table>

</body>
</html>
`;
}
function getGoalCalulatorTemplate({
  name = "Participant",
  email = "",
  assessmentDate = ""
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Risk Profile Assessment Received | Kanakdhara Investments</title>
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

          <!-- Title -->
          <tr>
            <td style="padding:32px 40px 16px;">
              <h1 style="margin:0 0 12px; font-size:24px; font-weight:700; color:#111827;">
                Your Goal Calculator Assessment Is Completed 
              </h1>
              <p style="margin:0; font-size:16px; line-height:1.6; color:#374151;">
                Dear <strong>${name}</strong>,<br /><br />
                Your personalized assessment is now ready and available for download below. 
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#374151;">
                Next Steps: We recommend reviewing your assessment carefully and, if needed, booking a free consultation with our financial experts to discuss a tailored plan for your future.
              </p>

              <p style="margin:0; font-size:15px; line-height:1.7; color:#374151;">
              Your financial goals are important, and we’re here to help you achieve them with clarity and confidence.with your financial goals and long-term objectives.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px; font-size:14px; color:#374151;">
                <tr>
                  <td style="padding:6px 0;"><strong>Email:</strong></td>
                  <td style="padding:6px 0;">${email}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;"><strong>Assessment Date:</strong></td>
                  <td style="padding:6px 0;">${assessmentDate}</td>
                </tr>
              </table>

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
                Explore Our Investment Philosophy
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px; font-size:14px; color:#374151;">
                If you have any questions regarding your risk assessment, feel free to reply to this email.
              </p>
              <p style="margin:0; font-size:14px; color:#374151;">
                Warm regards,<br />
                <strong>Chetan Joshi, CFP®</strong><br />
                Founder & CEO – Kanakdhara Investments<br/>
                Phone - +91 7890324370
              </p>
            </td>
          </tr>

          <!-- Disclaimer -->
          <tr>
            <td style="padding:16px 40px;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#6b7280;">
                Disclaimer: Risk profiling is a dynamic process and may change based on personal circumstances,
                financial goals, and market conditions. This assessment alone does not constitute investment advice.
                Investments are subject to market risks. Please read all scheme-related documents carefully.
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
  getBookFreeSessionMailTemplate,
  getContactMailTemplate,
  getJoinTeamMailTemplate,
  getRiskProfileSubmissionMailTemplate,
  getFinancialHealthQuizMailTemplate,
  getGoalCalulatorTemplate
}