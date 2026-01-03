const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload.middleware");
const {
    createBlog,
    updateBlog,
    getAllBlogs,
    getBlogById,
} = require("../controllers/blog.controller");
const { protectAdmin } = require("../middleware/auth.middleware");

// Create blog (admin)
router.post(
    "/create",
    protectAdmin,
    upload.single("image"),
    createBlog
);

// Update blog (admin)
router.put(
    "/editblog/:id",
    protectAdmin,
    upload.single("image"),
    updateBlog
);

// Public routes
router.get("/getAllblogs", getAllBlogs);
router.get("/getblog/:id", getBlogById);

module.exports = router;
