const goalModel = require("../models/goal.model")
const ReportModel = require("../models/report.model")
const IISModel = require("../models/iisForm.model")
const getActivityByID = async (req, res) => {
    const { activityId, customerId } = req.params
    const { type } = req.query;

    if (type.includes("goal")) {
        const goal = await goalModel.find({ _id: activityId, customerInfo: customerId })
        if (!goal) {
            return res.status(404).json({
                success: false,
                message: "Goal not found"
            })
        }
        return res.status(200).json({
            success: true,
            data: {
                ...goal,
                type: type
            }

        })
    } else if (type.includes("financial") || type.includes("risk")) {
        const report = await ReportModel.find({ _id: activityId, customerInfo: customerId })
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            })
        }
        return res.status(200).json({
            success: true,
            data: {
                ...report,
                type: type
            }
        })
    }
    else if (type.includes("IIS")) {
        const iis = await IISModel.find({ _id: activityId, customerInfo: customerId })
        if (!iis) {
            return res.status(404).json({
                success: false,
                message: "IIS not found"
            })
        }
        return res.status(200).json({
            success: true,
            data: {
                ...iis,
                type: type
            }
        })
    }
    else {
        return res.status(400).json({
            success: false,
            message: "Invalid activity type"
        })
    }
}

module.exports = {
    getActivityByID
}