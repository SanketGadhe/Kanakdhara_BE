const express = require("express");
const router = express.Router();

const {
    addDocument,
    getAllDocuments,
    getDocumentById,
    updateDocument,
} = require("../controllers/document.controller");

// Add document
router.post("/add", addDocument);

// Get all documents (with filters)
router.get("/all", getAllDocuments);

// Get document by ID
router.get("/:id", getDocumentById);

// Update document
router.put("/:id", updateDocument);

module.exports = router;
