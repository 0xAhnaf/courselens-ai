const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

exports.register = (req, res) => {
  const { name, email, password } = req.body;
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100 || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: "Use a name of 2–100 characters, valid email, and password of at least 8 characters (maximum 72 bytes)." });
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
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );
      res.status(201).json({ token, user: { id: this.lastID, name, email } });
    }
  );
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || !user) return res.status(400).json({ error: "Invalid credentials." });

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) return res.status(400).json({ error: "Invalid credentials." });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
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

// PUT /api/auth/me - Update user profile name
exports.updateProfile = (req, res) => {
  const { name } = req.body;
  const normalizedName = typeof name === "string" ? name.trim() : "";

  if (normalizedName.length < 2 || normalizedName.length > 100) {
    return res.status(400).json({ error: "Name must contain between 2 and 100 characters." });
  }

  db.run(
    `UPDATE users SET name = ? WHERE id = ?`,
    [normalizedName, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "User not found." });

      db.get(
        "SELECT id, name, email, created_at FROM users WHERE id = ?",
        [req.user.id],
        (selectErr, user) => {
          if (selectErr) return res.status(500).json({ error: selectErr.message });
          return res.json(user);
        }
      );
    }
  );
};
