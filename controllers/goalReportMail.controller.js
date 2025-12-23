const { htmlToPdfBuffer } = require("../utils/htmlToPdf.js");
const { GOAL_REPORT_CONFIG, generateGoalReportHtml } = require("../static/goalConfig.js");
const { sendMailToUser } = require("../services/mailService.js");
const { mailContent } = require("../static/mailContent.js");
const GoalReport = require("../models/goal.model.js")
const { getOrCreateCustomer } = require('./reportMail.controller.js')
const customerModel = require('../models/customerInfo.model.js')
const sendGoalReport = async (req, res) => {
    const payload = req.body;
    const { inputs, meta, results, uiContext, user } = payload
    const { goalId, subGoalId } = payload.meta;
    console.log("Preparing to send goal report:", goalId, subGoalId);
    const customer = await getOrCreateCustomer(user);
    console.log("Customer id", customer)
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
    const goalConfig = GOAL_REPORT_CONFIG[goalId];
    if (!goalConfig) throw new Error("Invalid goal");

    const subGoalConfig = goalConfig.subGoals.find(sg => sg.id === subGoalId);
    if (!subGoalConfig) throw new Error("Invalid sub-goal");

    const html = generateGoalReportHtml(payload, goalConfig, subGoalConfig);

    const pdf = await htmlToPdfBuffer(html);

    await sendMailToUser({
        toEmail: payload.user.email,
        subject: `${mailContent.GoalCalculatorMail.subject} - ${subGoalConfig.title}`,
        message: mailContent.GoalCalculatorMail.message,

        attachments: [
            {
                filename: `${goalId}_${subGoalId}.pdf`,
                content: pdf,
            },
        ],
    });

    res.json({ success: true });
};

module.exports = {
    sendGoalReport,
};