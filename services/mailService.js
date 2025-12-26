// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     },
// });

// const sendMail = async ({ toEmail = email, subject, message, attachments = [] }) => {
//     try {
//         await transporter.sendMail({
//             from: `"Kanakdhara Reports" <${process.env.EMAIL_USER}>`,
//             to: toEmail,
//             subject: subject,
//             text: message,
//             attachments: attachments,
//         });

//         return { success: true };
//     } catch (err) {
//         console.error(`Error sending email to ${toEmail}:`, err);
//         throw err;
//     }
// };
// module.exports = {
//     sendMail,
// };