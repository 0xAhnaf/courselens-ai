const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

exports.register = (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  const hash = bcrypt.hashSync(password, 10);
  db.run(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [name, email, hash],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ error: "Email already exists." });
        }
        return res.status(500).json({ error: err.message });
      }
      const token = jwt.sign(
        { id: this.lastID, email },
        process.env.JWT_SECRET || "supersecretkey",
        { expiresIn: "24h" }
      );
      res.status(201).json({ token, user: { id: this.lastID, name, email } });
    }
  );
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || !user) return res.status(400).json({ error: "Invalid credentials." });

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) return res.status(400).json({ error: "Invalid credentials." });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "24h" }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  });
};

exports.me = (req, res) => {
  db.get(
    "SELECT id, name, email, created_at FROM users WHERE id = ?",
    [req.user.id],
    (err, user) => {
      if (err || !user) return res.status(404).json({ error: "User not found." });
      res.json(user);
    }
  );
};