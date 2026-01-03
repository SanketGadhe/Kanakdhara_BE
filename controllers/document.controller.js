const Document = require("../models/Document.model");

/**
 * POST /documents/add
 */
exports.addDocument = async (req, res) => {
    try {
        const {
            title,
            category,
            type,
            size,
            date,
            downloadUrl,
        } = req.body;

        if (
            !title ||
            !category ||
            !type ||
            !size ||
            !date ||
            !downloadUrl
        ) {
            return res.status(400).json({
                error: "All fields are required",
            });
        }

        const document = await Document.create({
            title,
            category,
            type,
            size,
            date,
            downloadUrl,
        });

        return res.status(201).json({
            data: document,
            status: 201,
        });
    } catch (error) {
        return res.status(500).json({
            error: "Failed to add document",
        });
    }
};

/**
 * GET /documents/all
 * Optional filters: category, date
 */
exports.getAllDocuments = async (req, res) => {
    try {
        const { category, date } = req.query;

        const filter = {};
        if (category) filter.category = category;
        if (date) filter.date = date;

        const documents = await Document.find(filter).sort({
            createdAt: -1,
        });

        return res.status(200).json({
            data: documents,
            status: 200,
        });
    } catch (error) {
        return res.status(500).json({
            error: "Failed to fetch documents",
        });
    }
};

/**
 * GET /documents/:id
 */
exports.getDocumentById = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                error: "Document not found",
            });
        }

        return res.status(200).json({
            data: document,
            status: 200,
        });
    } catch (error) {
        return res.status(400).json({
            error: "Invalid document ID",
        });
    }
};

/**
 * PUT /documents/:id
 */
exports.updateDocument = async (req, res) => {
    try {
        const updated = await Document.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                error: "Document not found",
            });
        }

        return res.status(200).json({
            data: updated,
            status: 200,
        });
    } catch (error) {
        return res.status(500).json({
            error: "Failed to update document",
        });
    }
};
