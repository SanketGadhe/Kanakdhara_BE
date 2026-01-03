const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin.model");

exports.protectAdmin = async (req, res, next) => {
    try {
        const token =
            req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                error: "Not authorized, token missing",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id).select("-password");

        if (!admin) {
            return res.status(401).json({
                error: "Not authorized",
            });
        }

        req.admin = admin;
        next();
    } catch (error) {
        return res.status(401).json({
            error: "Invalid or expired token",
        });
    }
};
