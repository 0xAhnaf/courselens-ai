# Evidence and faculty review

All routes use the existing JWT authentication and analysis ownership checks.

`GET /api/analyses/:id` additionally returns `evidence_audit`: numbered source
questions, explicitly bracketed marks, declared marks, and a conservative arithmetic
status (`matched`, `mismatch`, `manual_check`). This is not an AI correctness score.
Question choices, ambiguous numbering and missing marks require manual review.

`GET /api/analyses/:id/review` returns `decision`, `note`, `report_hash`, `stale`
and, after saving, `updated_at` (UTC). Default decision is `pending`.

`PUT /api/analyses/:id/review` accepts:

```json
{"decision":"needs_revision","note":"Include CLO4 before approval.","report_hash":"hash returned by GET"}
```

Decisions: `pending`, `needs_revision`, `approved`. Notes: maximum 2,000
characters. Returns the saved review. Invalid input: 400; unauthenticated: 401;
not owned/not found: 404; processing or changed report: 409.

Reviews persist in SQLite without changing AI findings. A changed result invalidates
the previous review via its result hash; notes are retained for faculty re-review.
Deleting an analysis removes its review. The table and deletion trigger are created
idempotently on backend startup; existing records are preserved.

Automated verification: backend `npm test`; frontend `npm run lint` and
`npm run build`. Provider tests use mocks, not paid live AI calls. Faculty must
verify AI claims against source documents; schema validation does not prove accuracy.
