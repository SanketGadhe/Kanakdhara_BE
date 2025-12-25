const { htmlToPdfBuffer } = require("../utils/htmlToPdf.js");
const { GOAL_REPORT_CONFIG, generateGoalReportHtml } = require("../static/goalConfig.js");
const { sendMail } = require("../services/gmail.service.js");
const { mailContent } = require("../static/mailContent.js");
const GoalReport = require("../models/goal.model.js")
const { getOrCreateCustomer } = require('./reportMail.controller.js')
const customerModel = require('../models/customerInfo.model.js');
const { getGoalCalulatorTemplate } = require("../static/mailTemplate.js");
const sendGoalReport = async (req, res) => {
    const payload = req.body;
    const { inputs, meta, results, uiContext, user } = payload
    const { goalId, subGoalId } = payload.meta;
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
    const goalConfig = GOAL_REPORT_CONFIG[goalId];
    if (!goalConfig) throw new Error("Invalid goal");

    const subGoalConfig = goalConfig.subGoals.find(sg => sg.id === subGoalId);
    if (!subGoalConfig) throw new Error("Invalid sub-goal");

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

    res.json({ success: true });
};

module.exports = {
    sendGoalReport,
};