const db = require('../config/db');
const { createHash } = require('node:crypto');
const hash = value => createHash('sha256').update(value || '').digest('hex');

function ownedReport(req, res, callback) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid analysis ID.' });
  db.get('SELECT * FROM analyses WHERE id = ? AND user_id = ?', [id, req.user.id], (error, row) => {
    if (error) return res.status(500).json({ error: 'Could not load report.' });
    if (!row) return res.status(404).json({ error: 'Analysis not found.' });
    callback(row);
  });
}

exports.getReview = (req, res) => ownedReport(req, res, row => {
  db.get('SELECT * FROM analysis_reviews WHERE analysis_id = ?', [row.id], (error, review) => {
    if (error) return res.status(500).json({ error: 'Could not load faculty review.' });
    res.json({ decision: 'pending', note: '', ...review, report_hash: hash(row.result_json),
      stale: Boolean(review && review.report_hash !== hash(row.result_json)) });
  });
});

exports.saveReview = (req, res) => {
  const { decision, note, report_hash } = req.body;
  if (!['pending', 'approved', 'needs_revision'].includes(decision) || typeof note !== 'string' || note.length > 2000 || typeof report_hash !== 'string') {
    return res.status(400).json({ error: 'Choose a valid decision and a note of at most 2,000 characters.' });
  }
  ownedReport(req, res, row => {
    if (row.status !== 'completed' || hash(row.result_json) !== report_hash) return res.status(409).json({ error: 'Report changed or is processing. Reload before reviewing.' });
    db.run(`INSERT INTO analysis_reviews (analysis_id, decision, note, report_hash)
      SELECT id, ?, ?, ? FROM analyses WHERE id = ? AND user_id = ? AND status = 'completed' AND result_json = ?
      ON CONFLICT(analysis_id) DO UPDATE SET decision = excluded.decision, note = excluded.note,
        report_hash = excluded.report_hash, updated_at = CURRENT_TIMESTAMP`,
    [decision, note.trim(), report_hash, row.id, req.user.id, row.result_json], function (error) {
      if (error) return res.status(500).json({ error: 'Could not save faculty review.' });
      if (!this.changes) return res.status(409).json({ error: 'Report changed. Reload before reviewing.' });
      exports.getReview(req, res);
    });
  });
};
