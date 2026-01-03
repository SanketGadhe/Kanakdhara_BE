const express = require("express");
const router = express.Router();

const upload = require("../middleware/mailUpload.middleware");
const {
    sendMailController,
} = require("../controllers/mail.controller");

router.post(
    "/sendMail",
    upload.array("attachments"),
    sendMailController
);

module.exports = router;
