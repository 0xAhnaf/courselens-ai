const db = require("../config/db");
const { analyzeAssessment } = require("../services/ai/assessmentAgent");

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
      analyzeAssessment({ course_title, course_code, total_marks, syllabus_text, question_paper_text, previous_papers_text })
        .then((aiResult) => {
          const overallScore = aiResult.overall_score || 0;
          const resultJson = JSON.stringify(aiResult);

          db.run(
            `UPDATE analyses SET status = 'completed', overall_score = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [overallScore, resultJson, analysisId]
          );
        })
        .catch((aiErr) => {
          console.error("AI Analysis failed for ID", analysisId, ":", aiErr.message);
          db.run(
            `UPDATE analyses SET status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [aiErr.message || "AI Analysis execution failed", analysisId]
          );
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
  db.get(
    `SELECT * FROM analyses WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id],
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
  db.run(
    `DELETE FROM analyses WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Analysis not found or unauthorized." });
      res.json({ message: "Analysis deleted successfully." });
    }
  );
};

// POST /api/analyses/:id/retry - Retry a failed or processing analysis
exports.retryAnalysis = (req, res) => {
  const analysisId = req.params.id;
  const userId = req.user.id;

  db.get(
    `SELECT * FROM analyses WHERE id = ? AND user_id = ?`,
    [analysisId, userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Analysis not found." });

      db.run(
        `UPDATE analyses SET status = 'processing', error_message = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [analysisId],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ error: updateErr.message });

          res.json({ id: parseInt(analysisId), status: "processing", message: "Analysis re-triggered successfully." });

          analyzeAssessment({
            course_title: row.course_title,
            course_code: row.course_code,
            total_marks: row.total_marks,
            syllabus_text: row.syllabus_text,
            question_paper_text: row.question_paper_text,
            previous_papers_text: row.previous_papers_text
          })
            .then((aiResult) => {
              db.run(
                `UPDATE analyses SET status = 'completed', overall_score = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [aiResult.overall_score || 0, JSON.stringify(aiResult), analysisId]
              );
            })
            .catch((aiErr) => {
              db.run(
                `UPDATE analyses SET status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [aiErr.message || "AI Analysis execution failed", analysisId]
              );
            });
        }
      );
    }
  );
};