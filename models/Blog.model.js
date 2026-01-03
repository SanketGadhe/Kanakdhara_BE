const mongoose = require("mongoose");

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

module.exports = mongoose.model("Blog", blogSchema);
