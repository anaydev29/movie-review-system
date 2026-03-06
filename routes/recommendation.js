const express = require("express");
const router = express.Router();
const Recommendation = require("../models/Recommendation");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "supersecretkey";

/* ================= ADMIN AUTH ================= */
function adminAuth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = jwt.verify(token, JWT_SECRET);
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admins only" });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/* ================= GET ALL RECOMMENDATIONS ================= */
router.get("/", async (req, res) => {
  const recs = await Recommendation.find().sort({ createdAt: -1 });
  res.json(recs);
});

/* ================= ADD RECOMMENDATION ================= */
router.post("/", adminAuth, async (req, res) => {
  const { title, poster, reason } = req.body;

  if (!title || !poster) {
    return res.json({ error: "Title and poster required" });
  }

  const rec = await Recommendation.create({
    title,
    poster,
    reason
  });

  res.json(rec);
});

/* ================= DELETE RECOMMENDATION ================= */
router.delete("/:id", adminAuth, async (req, res) => {
  await Recommendation.findByIdAndDelete(req.params.id);
  res.json({ message: "Recommendation deleted" });
});

module.exports = router;
