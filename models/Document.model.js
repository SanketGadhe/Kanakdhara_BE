const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
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

        type: {
            type: String,
            enum: ["PDF", "PPT", "DOC"],
            required: true,
        },

        size: {
            type: String,
            required: true, // e.g. "2.4 MB"
        },

        date: {
            type: String,
            required: true, // FE-friendly (string)
        },

        downloadUrl: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
