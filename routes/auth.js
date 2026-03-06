const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Review = require("../models/Review");
const auth = require("../middleware/auth"); // ✅ must match module.exports

router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    const reviews = await Review.find({ username: user.username });

    res.json({
      username: user.username,
      role: user.role,
      reviewCount: reviews.length,
      watchCount: user.watchlist?.length || 0,
      reviews,
      watchlist: user.watchlist
    });
  } catch (err) {
    res.status(500).json({ error: "Profile fetch failed" });
  }
});

module.exports = router;
