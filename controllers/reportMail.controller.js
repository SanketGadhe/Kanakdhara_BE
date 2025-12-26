const { htmlToPdfBuffer } = require("../utils/htmlToPdf.js");
const { generateRiskProfileHtml, mailContent, generateFinancialHealthHtml } = require("../static/mailContent.js");
const { sendMail } = require("../services/gmail.service.js");
const customerModel = require("../models/customerInfo.model.js");
const reportModel = require("../models/report.model.js");
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

        // 1. Resolve customer and save report immediately
        const customerId = await getOrCreateCustomer(user);
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

        // Send immediate success response
        res.status(200).json({
            success: true,
            message: "Risk Profile Report request accepted. You will receive the PDF report via email shortly.",
            reportId: riskProfileReport._id
        });

        // Process PDF and email in background
        setImmediate(async () => {
            try {
                const htmlContentofRiskProfile = generateRiskProfileHtml({
                    user,
                    assessment,
                    allocation,
                    keyInputData
                });

                const pdfOfRiskProfile = await htmlToPdfBuffer(htmlContentofRiskProfile);

                await sendMail({
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

                console.log(`Risk profile report sent successfully to ${user.email}`);
            } catch (error) {
                console.error('Background risk profile processing failed:', error);
            }
        });

    } catch (error) {
        console.error("Error processing Risk Profile Report:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process Risk Profile Report request"
        });
    }
};
const sendFinancialHealthReport = async (req, res) => {
    try {
        const { user, assessment, keyInputs, investorPersona, actionCanBeTaken } = req.body;

        // 1. Resolve customer and save report immediately
        const customer = await getOrCreateCustomer(user);
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

        // Send immediate success response
        res.status(200).json({
            success: true,
            message: "Financial Health Report request accepted. You will receive the PDF report via email shortly.",
            reportId: financialHealthReport._id
        });

        // Process PDF and email in background
        setImmediate(async () => {
            try {
                const htmlContentofFinancialHealth = generateFinancialHealthHtml({
                    user,
                    assessment,
                    keyInputs,
                    investorPersona,
                    actionCanBeTaken
                });

                const pdfOfFinancialHealth = await htmlToPdfBuffer(htmlContentofFinancialHealth);

                await sendMail({
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

                console.log(`Financial health report sent successfully to ${user.email}`);
            } catch (error) {
                console.error('Background financial health processing failed:', error);
            }
        });

    } catch (error) {
        console.error("Error processing Financial Health Report:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process Financial Health Report request"
        });
    }
};


module.exports = {
    sendRiskProfileReport,
    sendFinancialHealthReport,
    getOrCreateCustomer
};