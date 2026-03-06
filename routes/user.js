const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const User = require("../models/User");
const Review = require("../models/Review");

// DELETE OWN REVIEW
router.delete("/review/:id", auth, async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review || review.userId.toString() !== req.user.userId) {
    return res.status(403).json({ error: "Not allowed" });
  }

  await review.deleteOne();
  res.json({ message: "Review deleted" });
});

// UPDATE OWN REVIEW
router.put("/review/:id", auth, async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review || review.userId.toString() !== req.user.userId) {
    return res.status(403).json({ error: "Not allowed" });
  }

  review.rating = req.body.rating;
  review.comment = req.body.comment;
  await review.save();

  res.json({ message: "Review updated" });
});

// GET USER PROFILE
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    const reviews = await Review.find({ userId: req.user.userId });

    res.json({
      username: user.username,
      role: user.role,
      reviewCount: reviews.length,
      watchCount: user.watchlist.length,
      reviews
    });
  } catch (err) {
    res.status(500).json({ error: "Profile load failed" });
  }
});

module.exports = router;

