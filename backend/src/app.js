const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const documentRoutes = require("./routes/documentRoutes");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

// Routes
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));
app.use("/api/auth", authRoutes);
app.use("/api/analyses", analysisRoutes);
app.use("/api/documents", documentRoutes);

app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body exceeds the 1 MB limit." });
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Request body contains invalid JSON." });
  }

  console.error("Unhandled request error:", err);
  return res.status(500).json({ error: "Internal server error." });
});

module.exports = app;
