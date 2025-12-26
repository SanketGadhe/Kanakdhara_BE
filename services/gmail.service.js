const { google } = require('googleapis');
const { getAuthorizedClient } = require('../utils/googleAuth');
const { getOwnerGoogleTokens } = require('../utils/getOwnerGoogleTokens');

/**
 * ONE-SHOT EMAIL SENDER
 * - PDF attachment is OPTIONAL
 * - Supports Buffer or base64
 * - Input validation and sanitization
 */
exports.sendMail = async ({
    to,
    subject,
    htmlMessage,
    pdf = null,
    pdfFileName = 'document.pdf',
}) => {
    // Quick validation
    if (!to || !subject || !htmlMessage) {
        throw new Error('Missing required email parameters');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
        throw new Error('Invalid email format');
    }
    
    try {
        const auth = getAuthorizedClient();
        const gmail = google.gmail({ version: 'v1', auth });

        const boundary = `boundary_${Date.now()}`;
        const lines = [
            `To: ${to.trim().toLowerCase()}`,
            'From: "Kanakdhara Investments" <me>',
            `Subject: ${subject.trim()}`,
            'MIME-Version: 1.0',
            `Content-Type: multipart/mixed; boundary="${boundary}"`,
            '',
            `--${boundary}`,
            'Content-Type: text/html; charset="UTF-8"',
            '',
            htmlMessage,
        ];

        if (pdf) {
            const pdfBase64 = Buffer.isBuffer(pdf) ? pdf.toString('base64') : pdf;
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

        const rawMessage = lines.join('\n').replace(/\n/g, '\r\n');
        const encodedMessage = Buffer.from(rawMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encodedMessage },
        });
        
        return response.data;
        
    } catch (error) {
        console.error('Gmail error:', error.message);
        throw new Error(`Email failed: ${error.message}`);
    }
};
