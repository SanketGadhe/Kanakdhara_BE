const mongoose = require("mongoose");

const blogLikeSchema = new mongoose.Schema(
    {
        blogId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Blog",
            required: true,
            index: true,
        },
        browserId: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
    },
    {
        collection: "blog_likes",
        timestamps: {
            createdAt: "created_at",
            updatedAt: false,
        },
    }
);

blogLikeSchema.index({ blogId: 1, browserId: 1 }, { unique: true });

module.exports = mongoose.model("BlogLike", blogLikeSchema);
