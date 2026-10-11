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
        await customerModel.findByIdAndUpdate(customerId, {
            $push: { lastActivity: { time: new Date(), purpose: "risk_assessment", reference: riskProfileReport._id } }
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

const hasRequiredUserDetails = (user) => Boolean(
    user?.name && user?.email && user?.phone && Number.isFinite(Number(user?.age))
);

const saveRiskProfileReport = async (req, res) => {
    try {
        const { user, metadata, allocation, assessment, keyInputData, notes } = req.body;

        if (!hasRequiredUserDetails(user) || !assessment || !allocation || !keyInputData) {
            return res.status(400).json({
                success: false,
                message: "User details and risk profile assessment data are required"
            });
        }

        const customer = await getOrCreateCustomer({
            ...user,
            email: user.email.trim().toLowerCase(),
            age: Number(user.age)
        });
        const report = await reportModel.create({
            reportType: "risk_profile",
            meta: {
                source: metadata?.source || "risk-profile-calculator",
                createdAt: metadata?.generatedAt || new Date()
            },
            customerInfo: customer._id,
            assessment,
            riskProfileData: { allocation, keyInputData, notes }
        });

        await customerModel.findByIdAndUpdate(customer._id, {
            $push: {
                lastActivity: {
                    time: new Date(),
                    purpose: "risk_assessment",
                    reference: report._id
                }
            }
        });

        return res.status(201).json({
            success: true,
            message: "Risk profile assessment saved",
            reportId: report._id
        });
    } catch (error) {
        console.error("Error saving Risk Profile Report:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save Risk Profile Report"
        });
    }
};

const emailSavedRiskProfileReport = async (req, res) => {
    try {
        const report = await reportModel
            .findOne({ _id: req.params.reportId, reportType: "risk_profile" })
            .populate("customerInfo");

        if (!report) {
            return res.status(404).json({ success: false, message: "Risk profile report not found" });
        }

        const user = report.customerInfo;
        if (!req.body.email || user.email.toLowerCase() !== req.body.email.trim().toLowerCase()) {
            return res.status(403).json({ success: false, message: "Email does not match this report" });
        }

        res.status(202).json({
            success: true,
            message: "Risk Profile Report email request accepted"
        });

        setImmediate(async () => {
            try {
                const html = generateRiskProfileHtml({
                    user,
                    assessment: report.assessment,
                    allocation: report.riskProfileData.allocation,
                    keyInputData: report.riskProfileData.keyInputData
                });
                const pdf = await htmlToPdfBuffer(html);

                await sendMail({
                    to: user.email,
                    subject: mailContent.RiskProfileMail.subject,
                    htmlMessage: getRiskProfileSubmissionMailTemplate({
                        name: user.name,
                        email: user.email,
                        assessmentDate: report.createdAt.toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'Asia/Kolkata'
                        })
                    }),
                    pdf,
                    pdfFileName: `${user.name}_Risk_Profile_Report.pdf`
                });
            } catch (error) {
                console.error("Background saved risk profile email failed:", error);
            }
        });
    } catch (error) {
        console.error("Error emailing saved Risk Profile Report:", error);
        return res.status(500).json({ success: false, message: "Failed to email Risk Profile Report" });
    }
};

const saveFinancialHealthReport = async (req, res) => {
    try {
        const { user, assessment, keyInputs, investorPersona, actionCanBeTaken } = req.body;

        if (!hasRequiredUserDetails(user) || !assessment || !keyInputs) {
            return res.status(400).json({
                success: false,
                message: "User details and financial health assessment data are required"
            });
        }

        const customer = await getOrCreateCustomer({
            ...user,
            email: user.email.trim().toLowerCase(),
            age: Number(user.age)
        });
        const report = await reportModel.create({
            reportType: "financial_health",
            meta: { source: "financial-health-calculator", createdAt: new Date() },
            customerInfo: customer._id,
            assessment,
            financialHealthData: { keyInputs, investorPersona, actionCanBeTaken }
        });

        await customerModel.findByIdAndUpdate(customer._id, {
            $push: {
                lastActivity: {
                    time: new Date(),
                    purpose: "financial_health",
                    reference: report._id
                }
            }
        });

        return res.status(201).json({
            success: true,
            message: "Financial health assessment saved",
            reportId: report._id
        });
    } catch (error) {
        console.error("Error saving Financial Health Report:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save Financial Health Report"
        });
    }
};

const emailSavedFinancialHealthReport = async (req, res) => {
    try {
        const report = await reportModel
            .findOne({ _id: req.params.reportId, reportType: "financial_health" })
            .populate("customerInfo");

        if (!report) {
            return res.status(404).json({ success: false, message: "Financial health report not found" });
        }

        const user = report.customerInfo;
        if (!req.body.email || user.email.toLowerCase() !== req.body.email.trim().toLowerCase()) {
            return res.status(403).json({ success: false, message: "Email does not match this report" });
        }

        res.status(202).json({
            success: true,
            message: "Financial Health Report email request accepted"
        });

        setImmediate(async () => {
            try {
                const html = generateFinancialHealthHtml({
                    user,
                    assessment: report.assessment,
                    keyInputs: report.financialHealthData.keyInputs,
                    investorPersona: report.financialHealthData.investorPersona,
                    actionCanBeTaken: report.financialHealthData.actionCanBeTaken
                });
                const pdf = await htmlToPdfBuffer(html);

                await sendMail({
                    to: user.email,
                    subject: mailContent.FinancialHealthMail.subject,
                    htmlMessage: getFinancialHealthQuizMailTemplate({
                        name: user.name,
                        email: user.email,
                        assessmentDate: report.createdAt.toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'Asia/Kolkata'
                        })
                    }),
                    pdf,
                    pdfFileName: `${user.name}_Financial_Health_Report.pdf`
                });
            } catch (error) {
                console.error("Background saved financial health email failed:", error);
            }
        });
    } catch (error) {
        console.error("Error emailing saved Financial Health Report:", error);
        return res.status(500).json({ success: false, message: "Failed to email Financial Health Report" });
    }
};

module.exports = {
    sendRiskProfileReport,
    sendFinancialHealthReport,
    saveRiskProfileReport,
    emailSavedRiskProfileReport,
    saveFinancialHealthReport,
    emailSavedFinancialHealthReport,
    getOrCreateCustomer
};
