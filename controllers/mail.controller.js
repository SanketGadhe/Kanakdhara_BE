const { sendMail } = require("../services/gmail.service");

/**
 * POST /mail/sendMail
 */
exports.sendMailController = async (req, res) => {
    try {
        const { to, subject, message } = req.body;

        if (!to || !subject || !message) {
            return res.status(400).json({
                error: "Missing required fields",
            });
        }

        let recipients;
        try {
            recipients = JSON.parse(to);
            if (!Array.isArray(recipients) || recipients.length === 0) {
                throw new Error();
            }
        } catch {
            return res.status(400).json({
                error: "Invalid recipients format",
            });
        }

        const attachments = req.files || [];

        // Send emails one by one
        const results = [];
        for (const email of recipients) {
            // If multiple attachments, send multiple mails OR first attachment only
            if (attachments.length === 0) {
                const result = await sendMail({
                    to: email,
                    subject,
                    htmlMessage: message,
                });
                results.push({ email, status: "sent" });
            } else {
                for (const file of attachments) {
                    await sendMail({
                        to: email,
                        subject,
                        htmlMessage: message,
                        pdf: file.buffer,
                        pdfFileName: file.originalname,
                    });
                }
                results.push({ email, status: "sent" });
            }
        }

        return res.status(200).json({
            data: results,
            status: 200,
        });
    } catch (error) {
        console.error("Mail send error:", error.message);
        return res.status(500).json({
            error: "Failed to send email(s)",
        });
    }
};
