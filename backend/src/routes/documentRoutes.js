const express = require("express");
const router = express.Router();
const documentController = require("../controllers/documentController");
const authMiddleware = require("../middleware/auth");
const { documentUpload } = require("../middleware/documentUpload");

router.post("/extract", authMiddleware, documentUpload, documentController.extractText);

module.exports = router;
