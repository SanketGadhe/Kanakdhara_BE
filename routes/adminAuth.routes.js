const express = require("express");
const router = express.Router();

const {
    loginAdmin,
    createAdmin,
} = require("../controllers/adminAuth.controller");

const { protectAdmin } = require("../middleware/auth.middleware");

// 🔓 Public
router.post("/admin/login", loginAdmin);

// 🔐 Protected — requires admin auth
router.post("/admin/createAdmin", protectAdmin, createAdmin);

module.exports = router;
