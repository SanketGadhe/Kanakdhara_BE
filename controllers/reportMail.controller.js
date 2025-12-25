const { htmlToPdfBuffer } = require("../utils/htmlToPdf.js");
const { generateRiskProfileHtml, mailContent, generateFinancialHealthHtml } = require("../static/mailContent.js");
const { sendMail } = require("../services/gmail.service.js");
const customerModel = require("../models/customerInfo.model.js");
const reportModel = require("../models/report.model.js");
const { ref } = require("process");
const { getCustomerById } = require("./customerInfo.controllers.js");
const { getRiskProfileSubmissionMailTemplate, getFinancialHealthQuizMailTemplate } = require("../static/mailTemplate.js");


const getOrCreateCustomer = async (user) => {

    let customer = await customerModel.findOne({ email: user.email });

    if (!customer) {
        customer = await customerModel.create({
            name: user.name,
            email: user.email,
            phone: user.phone,
            age: user.age
        });
    }

    return customer;
};

const sendRiskProfileReport = async (req, res) => {
    try {
        const { user, metadata, allocation, assessment, keyInputData, notes } = req.body;

        // 1. Resolve customer
        const customerId = await getOrCreateCustomer(user);

        // 2. Save report
        const riskProfileReport = await reportModel.create({
            reportType: "risk_profile",
            meta: {
                source: metadata?.source || "risk-profile-calculator",
                createdAt: metadata?.generatedAt || new Date()
            },
            customerInfo: customerId,
            assessment,
            riskProfileData: {
                allocation,
                keyInputData,
                notes
            }
        });

        // 3. Generate PDF
        const htmlContentofRiskProfile = generateRiskProfileHtml({
            user,
            assessment,
            allocation,
            keyInputData
        });

        const pdfOfRiskProfile = await htmlToPdfBuffer(htmlContentofRiskProfile);

        // 4. Send mail
        const sentMailResult = await sendMail({
            to: user.email,
            subject: mailContent.RiskProfileMail.subject,
            htmlMessage: getRiskProfileSubmissionMailTemplate({
                name: user.name,
                email: user.email,
                assessmentDate: new Date().toLocaleString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'Asia/Kolkata'
                })
            }),
            pdf: pdfOfRiskProfile,
            pdfFileName: `${user.name}_Risk_Profile_Report.pdf`
        });

        // if (!sentMailResult.success) {
        //     throw new Error("Failed to send email");
        // }

        res.status(200).json({
            success: true,
            message: "Risk Profile Report sent & saved successfully.",
            reportId: riskProfileReport._id
        });
    } catch (error) {
        console.error("Error sending Risk Profile Report:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send Risk Profile Report",
            error: error.message
        });
    }
};
const sendFinancialHealthReport = async (req, res) => {
    try {
        const { user, assessment, keyInputs, investorPersona, actionCanBeTaken } = req.body;

        // 1. Resolve customer
        const customer = await getOrCreateCustomer(user);

        // 2. Save report
        const financialHealthReport = await reportModel.create({
            reportType: "financial_health",
            meta: {
                source: "financial-health-calculator",
                createdAt: new Date()
            },
            customerInfo: customer._id,
            assessment,
            financialHealthData: {
                keyInputs,
                investorPersona,
                actionCanBeTaken
            }
        });

        await customerModel.findByIdAndUpdate(customer._id, {
            $push: { lastActivity: { time: new Date(), purpose: "financial_health", reference: financialHealthReport._id } }
        });


        // 3. Generate PDF
        const htmlContentofFinancialHealth = generateFinancialHealthHtml({
            user,
            assessment,
            keyInputs,
            investorPersona,
            actionCanBeTaken
        });

        const pdfOfFinancialHealth = await htmlToPdfBuffer(htmlContentofFinancialHealth);

        // 4. Send mail
        const sentMailResult = await sendMail({
            to: user.email,
            subject: mailContent.FinancialHealthMail.subject,
            htmlMessage: getFinancialHealthQuizMailTemplate({
                name: user.name,
                email: user.email,
                assessmentDate: new Date().toLocaleString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'Asia/Kolkata'
                })
            }),
            pdf: pdfOfFinancialHealth,
            pdfFileName: `${user.name}_Financial_Health_Report.pdf`
        });

        // if (!sentMailResult.success) {
        //     throw new Error("Failed to send email");
        // }

        res.status(200).json({
            success: true,
            message: "Financial Health Report sent & saved successfully.",
            reportId: financialHealthReport._id
        });
    } catch (error) {
        console.error("Error sending Financial Health Report:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send Financial Health Report",
            error: error.message
        });
    }
};


module.exports = {
    sendRiskProfileReport,
    sendFinancialHealthReport,
    getOrCreateCustomer
};