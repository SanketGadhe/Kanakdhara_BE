const { google } = require('googleapis');
const { getAuthorizedClient } = require('../utils/googleAuth');
const { getOwnerGoogleTokens } = require('../utils/getOwnerGoogleTokens');

/**
 * ONE-SHOT EMAIL SENDER
 * - PDF attachment is OPTIONAL
 * - Supports Buffer or base64
 */
exports.sendMail = async ({
    to,
    subject,
    htmlMessage,
    pdf = null,
    pdfFileName = 'document.pdf',
}) => {
    const { access_token, refresh_token } = await getOwnerGoogleTokens();
    const auth = getAuthorizedClient({
        refresh_token: refresh_token,
    })
    const gmail = google.gmail({ version: 'v1', auth });

    const boundary = `boundary_${Date.now()}`;
    const lines = [
        `To: ${to}`,
        'From: "Calendar Booking" <me>',
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        '',
        htmlMessage,
    ];

    // 📎 Attach PDF only if provided
    if (pdf) {
        const pdfBase64 = Buffer.isBuffer(pdf)
            ? pdf.toString('base64')
            : pdf;

        lines.push(
            '',
            `--${boundary}`,
            `Content-Type: application/pdf; name="${pdfFileName}"`,
            'Content-Transfer-Encoding: base64',
            `Content-Disposition: attachment; filename="${pdfFileName}"`,
            '',
            pdfBase64
        );
    }

    lines.push(`--${boundary}--`);

    const rawMessage = lines
        .join('\n')
        .replace(/\n/g, '\r\n');

    const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage },
    });
};
