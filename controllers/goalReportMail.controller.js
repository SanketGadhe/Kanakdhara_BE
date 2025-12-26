const { htmlToPdfBuffer } = require("../utils/htmlToPdf.js");
const { GOAL_REPORT_CONFIG, generateGoalReportHtml } = require("../static/goalConfig.js");
const { sendMail } = require("../services/gmail.service.js");
const { mailContent } = require("../static/mailContent.js");
const GoalReport = require("../models/goal.model.js")
const { getOrCreateCustomer } = require('./reportMail.controller.js')
const customerModel = require('../models/customerInfo.model.js');
const { getGoalCalulatorTemplate } = require("../static/mailTemplate.js");
const sendGoalReport = async (req, res) => {
    try {
        const payload = req.body;
        const { inputs, meta, results, uiContext, user } = payload;
        const { goalId, subGoalId } = payload.meta;
        
        // Validate goal configuration
        const goalConfig = GOAL_REPORT_CONFIG[goalId];
        if (!goalConfig) {
            return res.status(400).json({ success: false, message: "Invalid goal" });
        }

        const subGoalConfig = goalConfig.subGoals.find(sg => sg.id === subGoalId);
        if (!subGoalConfig) {
            return res.status(400).json({ success: false, message: "Invalid sub-goal" });
        }

        // Create customer and save report immediately
        const customer = await getOrCreateCustomer(user);
        const CreatedGoal = await GoalReport.create({
            customerInfo: customer._id,
            meta,
            inputs,
            results,
            uiContext
        });
        
        await customerModel.findByIdAndUpdate(customer._id, {
            $push: { lastActivity: { time: new Date(), purpose: `${goalId}-${subGoalId}`, reference: CreatedGoal._id } }
        });

        // Send immediate success response
        res.json({ 
            success: true, 
            message: "Report request accepted. You will receive the PDF report via email shortly.",
            reportId: CreatedGoal._id
        });

        // Process PDF and email in background (don't await)
        setImmediate(async () => {
            try {
                const html = generateGoalReportHtml(payload, goalConfig, subGoalConfig);
                const pdf = await htmlToPdfBuffer(html);

                await sendMail({
                    to: payload.user.email,
                    subject: `${mailContent.GoalCalculatorMail.subject} - ${subGoalConfig.title} - Kanakdhara Investments`,
                    htmlMessage: getGoalCalulatorTemplate({
                        name: payload.user.name,
                        email: payload.user.email,
                        assessmentDate: new Date().toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'Asia/Kolkata'
                        })
                    }),
                    pdf: pdf,
                    pdfFileName: `${goalId}_${subGoalId}.pdf`
                });
                
                console.log(`Goal report sent successfully to ${payload.user.email}`);
            } catch (error) {
                console.error('Background PDF processing failed:', error);
            }
        });
        
    } catch (error) {
        console.error('Goal report error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process goal report request' 
        });
    }
};

module.exports = {
    sendGoalReport,
};