const express = require("express");
const router = express.Router();

const {
    getBlogLikeCount,
    likeBlog,
} = require("../controllers/blogLike.controller");

router.get("/:blogId/likes", getBlogLikeCount);
router.post("/:blogId/like", likeBlog);

module.exports = router;
