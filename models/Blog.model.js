const mongoose = require("mongoose");

const DEFAULT_BLOG_TAGLINE =
    "Founder & CEO at Kanakdhara Investments. Passionate about simplifying wealth creation for Indian families.";

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        category: {
            type: String,
            required: true,
            index: true,
        },

        desc: {
            type: String,
            required: true,
        },

        image: {
            type: String,
            required: true,
        },

        author: {
            type: String,
            required: true,
        },

        tagline: {
            type: String,
            trim: true,
            default: DEFAULT_BLOG_TAGLINE,
        },

        date: {
            type: String, // keeping string as per FE usage (Dec 22, 2025)
            required: true,
        },

        htmlContent: {
            type: String,
            required: true,
        },

        isPublished: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

blogSchema.statics.defaultTagline = DEFAULT_BLOG_TAGLINE;

module.exports = mongoose.model("Blog", blogSchema);
