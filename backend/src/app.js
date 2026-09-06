const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const analysisRoutes = require("./routes/analysisRoutes");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// Routes
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));
app.use("/api/auth", authRoutes);
app.use("/api/analyses", analysisRoutes);

module.exports = app;