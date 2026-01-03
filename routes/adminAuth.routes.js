const express = require("express");
const router = express.Router();

const {
    loginAdmin,
    createAdmin,
} = require("../controllers/adminAuth.controller");

const { protectAdmin } = require("../middleware/auth.middleware");

// 🔓 Public
router.post("/admin/login", loginAdmin);

// 🔐 Protected
router.post("/admin/createAdmin", createAdmin);

module.exports = router;
