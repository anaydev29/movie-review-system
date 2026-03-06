const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Review = require("../models/Review");
const Recommendation = require("../models/Recommendation");

const jwt = require("jsonwebtoken");
const JWT_SECRET = "supersecretkey";

/* ADMIN AUTH */
function adminAuth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = jwt.verify(token, JWT_SECRET);
    if (user.role !== "admin")
      return res.status(403).json({ error: "Admin only" });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/* USERS */
router.get("/users", adminAuth, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

/* REVIEWS */
router.get("/reviews", adminAuth, async (req, res) => {
  const reviews = await Review.find();
  res.json(reviews);
});

/* RECOMMENDATIONS */
router.get("/recommendations", adminAuth, async (req, res) => {
  const list = await Recommendation.find();
  res.json(list);
});

module.exports = router;
