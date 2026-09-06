const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const dbPath = process.env.DATABASE_PATH || "./data/courselens.db";
const dbDir = path.dirname(dbPath);

// Ensure the directory exists before SQLite tries to open the file
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("SQLite connection error:", err.message);
  else console.log("Connected to SQLite database.");
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS analysis_reviews (
    analysis_id INTEGER PRIMARY KEY, decision TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '', report_hash TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_title TEXT NOT NULL,
      course_code TEXT NOT NULL,
      department TEXT,
      exam_type TEXT,
      semester TEXT,
      exam_date TEXT,
      total_marks INTEGER NOT NULL,
      syllabus_text TEXT NOT NULL,
      question_paper_text TEXT NOT NULL,
      previous_papers_text TEXT,
      status TEXT DEFAULT "processing",
      overall_score INTEGER,
      result_json TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  db.run(`CREATE TRIGGER IF NOT EXISTS remove_analysis_review AFTER DELETE ON analyses
    BEGIN DELETE FROM analysis_reviews WHERE analysis_id = OLD.id; END`);
});

module.exports = db;
