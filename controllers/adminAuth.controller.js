const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin.model");

const generateToken = (adminId) => {
    return jwt.sign(
        { id: adminId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

/**
 * POST /admin/login
 */
exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required",
            });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({
                error: "Invalid email or password",
            });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                error: "Invalid email or password",
            });
        }

        const token = generateToken(admin._id);

        return res.status(200).json({
            data: {
                token,
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                },
            },
            status: 200,
        });
    } catch (error) {
        return res.status(500).json({
            error: "Login failed. Please try again.",
        });
    }
};

/**
 * POST /admin/createAdmin
 */
exports.createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "All fields are required",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters",
            });
        }

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(409).json({
                error: "Admin with this email already exists",
            });
        }

        const newAdmin = await Admin.create({
            name,
            email,
            password,
        });

        return res.status(201).json({
            data: {
                id: newAdmin._id,
                name: newAdmin.name,
                email: newAdmin.email,
            },
            status: 201,
        });
    } catch (error) {
        return res.status(500).json({
            error: "Unable to create admin",
        });
    }
};
