const db = require("../config/db");
const { analyzeAssessment } = require("../services/ai/assessmentAgent");

const runAnalysisJob = (analysisId, data) => {
  analyzeAssessment(data)
    .then((aiResult) => {
      const overallScore = aiResult.overall_score || 0;
      const resultJson = JSON.stringify(aiResult);

      db.run(
        `UPDATE analyses SET status = 'completed', overall_score = ?, result_json = ?, error_message = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'processing'`,
        [overallScore, resultJson, analysisId],
        (updateErr) => {
          if (updateErr) console.error("Failed to save AI result for ID", analysisId, ":", updateErr.message);
        }
      );
    })
    .catch((aiErr) => {
      console.error("AI Analysis failed for ID", analysisId, ":", aiErr.message);
      db.run(
        `UPDATE analyses SET status = 'failed', overall_score = NULL, result_json = NULL, error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'processing'`,
        [aiErr.message || "AI Analysis execution failed", analysisId],
        (updateErr) => {
          if (updateErr) console.error("Failed to save AI error for ID", analysisId, ":", updateErr.message);
        }
      );
    });
};

// POST /api/analyses - Create & trigger background AI audit
exports.createAnalysis = (req, res) => {
  const userId = req.user.id;
  const {
    course_title,
    course_code,
    department,
    exam_type,
    semester,
    exam_date,
    total_marks,
    syllabus_text,
    question_paper_text,
    previous_papers_text
  } = req.body;

  if (!course_title || !course_code || !total_marks || !syllabus_text || !question_paper_text) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (![course_title, course_code, syllabus_text, question_paper_text].every((value) => typeof value === 'string' && value.trim()) || !Number.isFinite(Number(total_marks)) || Number(total_marks) <= 0 || Number(total_marks) > 10000) {
    return res.status(400).json({ error: 'Use valid course text and total marks between 1 and 10000.' });
  }
  const materials = [syllabus_text, question_paper_text, previous_papers_text || ''];
  if (!materials.every((value) => typeof value === 'string') || materials.join('').length > 60000) {
    return res.status(400).json({ error: 'Course materials must be text with a combined maximum of 60,000 characters. Upload only the relevant pages or edit extracted text.' });
  }

  // 1. Save initial record with status = 'processing'
  const query = `
    INSERT INTO analyses 
    (user_id, course_title, course_code, department, exam_type, semester, exam_date, total_marks, syllabus_text, question_paper_text, previous_papers_text, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing')
  `;

  db.run(
    query,
    [userId, course_title, course_code, department, exam_type, semester, exam_date, total_marks, syllabus_text, question_paper_text, previous_papers_text],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const analysisId = this.lastID;

      // Respond immediately with processing status so UI doesn't hang
      res.status(202).json({
        id: analysisId,
        status: "processing",
        message: "Analysis request submitted successfully."
      });

      // 2. Trigger AI analysis asynchronously
      runAnalysisJob(analysisId, {
        course_title,
        course_code,
        total_marks,
        syllabus_text,
        question_paper_text,
        previous_papers_text
      });
    }
  );
};

// GET /api/analyses - Get all analyses for logged-in user
exports.getUserAnalyses = (req, res) => {
  db.all(
    `SELECT id, course_title, course_code, department, exam_type, semester, status, overall_score, created_at FROM analyses WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// GET /api/analyses/:id - Get single analysis result
exports.getAnalysisById = (req, res) => {
  const analysisId = Number(req.params.id);

  if (!Number.isInteger(analysisId) || analysisId < 1) {
    return res.status(400).json({ error: "Invalid analysis ID." });
  }

  db.get(
    `SELECT * FROM analyses WHERE id = ? AND user_id = ?`,
    [analysisId, req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Analysis record not found." });

      if (row.result_json) {
        try {
          row.result_json = JSON.parse(row.result_json);
        } catch (e) {
          console.error("Failed to parse result_json");
        }
      }
      res.json(row);
    }
  );
};

// DELETE /api/analyses/:id - Delete analysis
exports.deleteAnalysis = (req, res) => {
  const analysisId = Number(req.params.id);

  if (!Number.isInteger(analysisId) || analysisId < 1) {
    return res.status(400).json({ error: "Invalid analysis ID." });
  }

  db.run(
    `DELETE FROM analyses WHERE id = ? AND user_id = ?`,
    [analysisId, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Analysis not found or unauthorized." });
      res.json({ message: "Analysis deleted successfully." });
    }
  );
};

// POST /api/analyses/:id/retry - Retry a failed or processing analysis
exports.retryAnalysis = (req, res) => {
  const analysisId = Number(req.params.id);
  const userId = req.user.id;

  if (!Number.isInteger(analysisId) || analysisId < 1) {
    return res.status(400).json({ error: "Invalid analysis ID." });
  }

  db.get(
    `SELECT * FROM analyses WHERE id = ? AND user_id = ?`,
    [analysisId, userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Analysis not found." });

      if (row.status === "processing") {
        return res.status(409).json({ error: "This analysis is already processing." });
      }

      db.run(
        `UPDATE analyses SET status = 'processing', overall_score = NULL, result_json = NULL, error_message = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND status != 'processing'`,
        [analysisId, userId],
        function (updateErr) {
          if (updateErr) return res.status(500).json({ error: updateErr.message });
          if (this.changes === 0) return res.status(409).json({ error: "This analysis is already processing." });

          res.status(202).json({ id: analysisId, status: "processing", message: "Analysis re-triggered successfully." });

          runAnalysisJob(analysisId, {
            course_title: row.course_title,
            course_code: row.course_code,
            total_marks: row.total_marks,
            syllabus_text: row.syllabus_text,
            question_paper_text: row.question_paper_text,
            previous_papers_text: row.previous_papers_text
          });
        }
      );
    }
  );
};
