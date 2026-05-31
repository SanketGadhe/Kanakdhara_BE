const BlogLike = require("../models/BlogLike.model");

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
const MAX_BROWSER_ID_LENGTH = 200;

function isValidBlogId(blogId) {
    return typeof blogId === "string" && OBJECT_ID_REGEX.test(blogId);
}

function normalizeBrowserId(browserId) {
    return typeof browserId === "string" ? browserId.trim() : "";
}

function isDuplicateKeyError(error) {
    return error?.code === 11000;
}

exports.getBlogLikeCount = async (req, res) => {
    try {
        const { blogId } = req.params;

        if (!isValidBlogId(blogId)) {
            return res.status(400).json({
                error: "Invalid blogId",
            });
        }

        const count = await BlogLike.countDocuments({ blogId });
        return res.status(200).json({ count });
    } catch (error) {
        console.error("Failed to fetch blog like count:", error);
        return res.status(500).json({
            error: "Failed to fetch blog like count",
        });
    }
};

exports.likeBlog = async (req, res) => {
    try {
        const { blogId } = req.params;
        const browserId = normalizeBrowserId(req.body?.browserId);

        if (!isValidBlogId(blogId)) {
            return res.status(400).json({
                error: "Invalid blogId",
            });
        }

        if (!browserId) {
            return res.status(400).json({
                error: "browserId is required",
            });
        }

        if (browserId.length > MAX_BROWSER_ID_LENGTH) {
            return res.status(400).json({
                error: "browserId is too long",
            });
        }

        try {
            await BlogLike.create({ blogId, browserId });
        } catch (error) {
            if (!isDuplicateKeyError(error)) {
                throw error;
            }

            const count = await BlogLike.countDocuments({ blogId });
            return res.status(200).json({
                count,
                liked: true,
                message: "Already liked",
            });
        }

        const count = await BlogLike.countDocuments({ blogId });
        return res.status(200).json({
            count,
            liked: true,
        });
    } catch (error) {
        console.error("Failed to like blog:", error);
        return res.status(500).json({
            error: "Failed to like blog",
        });
    }
};
