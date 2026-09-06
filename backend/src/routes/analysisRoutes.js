const express = require("express");
const router = express.Router();
const analysisController = require("../controllers/analysisController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.post("/", analysisController.createAnalysis);
router.get("/", analysisController.getUserAnalyses);
router.post("/:id/retry", analysisController.retryAnalysis);
router.get("/:id", analysisController.getAnalysisById);
router.delete("/:id", analysisController.deleteAnalysis);

module.exports = router;
