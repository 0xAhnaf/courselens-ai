const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { after, before, test } = require("node:test");
const jwt = require("jsonwebtoken");

process.env.DATABASE_PATH = ":memory:";
process.env.JWT_SECRET = "test-only-jwt-secret";
process.env.AI_API_KEY = "test-only-ai-key";

let jobDelay = 0;
const assessmentAgent = require("../src/services/ai/assessmentAgent");
assessmentAgent.analyzeAssessment = async () => {
  if (jobDelay) await new Promise((resolve) => setTimeout(resolve, jobDelay));
  return {
    overall_score: 82,
    coverage_percentage: 75,
    summary: "Test analysis completed.",
    clo_coverage: [],
    topic_coverage: [],
    bloom_distribution: {},
    difficulty_distribution: {},
    duplicate_questions: [],
    detected_issues: [],
    recommendations: []
  };
};

const app = require("../src/app");
const db = require("../src/config/db");

let baseUrl;
let server;
let token;
let userId;

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) reject(error);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) reject(error);
      else resolve(row);
    });
  });

const waitForStatus = async (analysisId, expectedStatus) => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const row = await get("SELECT * FROM analyses WHERE id = ?", [analysisId]);
    if (row?.status === expectedStatus) return row;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  throw new Error(`Analysis ${analysisId} did not reach ${expectedStatus}.`);
};

const authenticatedHeaders = () => ({ Authorization: `Bearer ${token}` });

const uploadDocument = async ({ data, name, type, authenticated = true }) => {
  const form = new FormData();
  form.append("file", new Blob([data], { type }), name);
  const headers = authenticated ? authenticatedHeaders() : {};

  return fetch(`${baseUrl}/api/documents/extract`, {
    method: "POST",
    headers,
    body: form
  });
};

before(async () => {
  const user = await run(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    ["Initial Name", "faculty@example.com", "unused-test-hash"]
  );
  userId = user.lastID;
  token = jwt.sign({ id: userId, email: "faculty@example.com" }, process.env.JWT_SECRET);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await new Promise((resolve, reject) => db.close((error) => (error ? reject(error) : resolve())));
});

test("document extraction requires authentication", async () => {
  const response = await uploadDocument({
    data: "A valid plain-text syllabus document.",
    name: "syllabus.txt",
    type: "text/plain",
    authenticated: false
  });

  assert.equal(response.status, 401);
});

test("extracts TXT documents", async () => {
  const response = await uploadDocument({
    data: "CLO1: Analyze algorithm complexity.",
    name: "syllabus.txt",
    type: "text/plain"
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.file_name, "syllabus.txt");
  assert.match(body.text, /CLO1/);
  assert.equal(body.page_count, 1);
});

test("extracts PDF documents using the v2 parser API", async () => {
  const fixture = fs.readFileSync(path.join(__dirname, "fixtures", "sample.pdf"));
  const response = await uploadDocument({
    data: fixture,
    name: "QUESTION-PAPER.PDF",
    type: "application/pdf"
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.match(body.text, /CourseLens PDF extraction test/);
  assert.equal(body.page_count, 1);
});

test("rejects unsupported and forged document types", async () => {
  const unsupported = await uploadDocument({
    data: "not an image",
    name: "image.png",
    type: "image/png"
  });
  assert.equal(unsupported.status, 400);

  const forgedPdf = await uploadDocument({
    data: "This is not actually a PDF file.",
    name: "fake.pdf",
    type: "application/pdf"
  });
  const forgedBody = await forgedPdf.json();
  assert.equal(forgedPdf.status, 400);
  assert.match(forgedBody.error, /not a valid PDF/i);
});

test("returns JSON when an uploaded file exceeds 5 MB", async () => {
  const response = await uploadDocument({
    data: new Uint8Array(5 * 1024 * 1024 + 1),
    name: "oversized.txt",
    type: "text/plain"
  });
  const body = await response.json();

  assert.equal(response.status, 413);
  assert.match(body.error, /5 MB/i);
});

test("returns JSON when a request body exceeds 1 MB", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "x".repeat(1024 * 1024), password: "test" })
  });
  const body = await response.json();

  assert.equal(response.status, 413);
  assert.match(body.error, /1 MB/i);
});

test("validates and persists profile-name updates", async () => {
  const invalidResponse = await fetch(`${baseUrl}/api/auth/me`, {
    method: "PUT",
    headers: { ...authenticatedHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ name: "A" })
  });
  assert.equal(invalidResponse.status, 400);

  const response = await fetch(`${baseUrl}/api/auth/me`, {
    method: "PUT",
    headers: { ...authenticatedHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Updated Faculty Name" })
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.name, "Updated Faculty Name");
  assert.equal(body.email, "faculty@example.com");
  assert.ok(body.created_at);

  const savedUser = await get("SELECT name FROM users WHERE id = ?", [userId]);
  assert.equal(savedUser.name, "Updated Faculty Name");
});

test("prevents duplicate retry jobs and clears stale results", async () => {
  const created = await run(
    `INSERT INTO analyses
      (user_id, course_title, course_code, total_marks, syllabus_text, question_paper_text, status, overall_score, result_json, error_message)
     VALUES (?, ?, ?, ?, ?, ?, 'failed', 30, ?, 'old error')`,
    [userId, "Algorithms", "CSE 3101", 50, "CLO1: Analyze algorithms.", "Q1: Analyze merge sort.", '{"old":true}']
  );

  jobDelay = 120;
  const firstRetry = await fetch(`${baseUrl}/api/analyses/${created.lastID}/retry`, {
    method: "POST",
    headers: authenticatedHeaders()
  });
  assert.equal(firstRetry.status, 202);

  const processingRow = await get("SELECT * FROM analyses WHERE id = ?", [created.lastID]);
  assert.equal(processingRow.status, "processing");
  assert.equal(processingRow.overall_score, null);
  assert.equal(processingRow.result_json, null);
  assert.equal(processingRow.error_message, null);

  const duplicateRetry = await fetch(`${baseUrl}/api/analyses/${created.lastID}/retry`, {
    method: "POST",
    headers: authenticatedHeaders()
  });
  assert.equal(duplicateRetry.status, 409);

  const completedRow = await waitForStatus(created.lastID, "completed");
  assert.equal(completedRow.overall_score, 82);
  assert.match(completedRow.result_json, /Test analysis completed/);
  jobDelay = 0;
});
