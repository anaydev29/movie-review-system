require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");

const User = require("./models/User");
const Review = require("./models/Review");
const Recommendation = require("./models/Recommendation"); // ⚠ check filename
const Discussion = require("./models/Discussion");
const EpisodeReview = require("./models/EpisodeReview");

const recommendationRoutes = require("./routes/recommendation");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = "supersecretkey";
const OMDB_KEY = "cfd54802";
const fetch = (...args) =>
  import('node-fetch').then(({default: fetch}) => fetch(...args));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", adminRoutes);
app.use("/user", userRoutes);

/* ================= DB ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log(err));

/* ================= ROUTES ================= */
app.use("/recommendations", recommendationRoutes);

/* ================= AUTH MIDDLEWARE ================= */
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/* ================= AUTH ================= */
app.post("/auth/signup", async (req, res) => {
  const { username, password } = req.body;
  const exists = await User.findOne({ username });
  if (exists) return res.json({ error: "User exists" });

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ username, password: hashed });

  res.json({ message: "Signup successful" });
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.json({ error: "User not found" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.json({ error: "Wrong password" });

  const token = jwt.sign(
    {
      userId: user._id,
      username: user.username,
      role: user.role   // THIS IS IMPORTANT
    },
    JWT_SECRET
  );

  res.json({
    token,
    role: user.role
  });
});

/* ================= MOVIES ================= */
app.get("/movie/:name", async (req, res) => {
  try {
    const name = encodeURIComponent(req.params.name);
    const r = await fetch(
      `https://www.omdbapi.com/?apikey=${OMDB_KEY}&t=${name}`
    );
    const data = await r.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: "Movie fetch failed" });
  }
});

app.get("/trending", async (req, res) => {
  const keywords = ["action", "war", "love", "crime", "future"];
  const key = keywords[Math.floor(Math.random() * keywords.length)];
  const url = `https://www.omdbapi.com/?apikey=cfd54802&s=${key}`;
  const r = await axios.get(url);
  res.json(r.data.Search || []);
});

/* ================= REVIEWS ================= */
app.post("/review", auth, async (req, res) => {
  const { movieId, rating, comment, movieTitle } = req.body;

  await Review.create({
    movieId,
    movieTitle: movieTitle || "Unknown",
    rating,
    comment,
    userId: req.user.userId,
    username: req.user.username
  });

  res.json({ message: "Review added" });
});

app.get("/reviews/:movieId", async (req, res) => {
  const reviews = await Review.find({ movieId: req.params.movieId });
  console.log("REVIEWS SENT:", reviews);
  res.json(reviews);
});

app.get("/average/:movieId", async (req, res) => {
  const reviews = await Review.find({ movieId: req.params.movieId });
  if (!reviews.length) return res.json({ average: 0 });

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  res.json({ average: avg.toFixed(1) });
});

// ADMIN: DELETE A REVIEW
app.delete("/admin/review/:id", auth, async (req, res) => {
  try {
    // allow only admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// ADMIN: GET ALL REVIEWS
app.get("/reviews-all", auth, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin only" });

  const reviews = await Review.find();
  res.json(reviews);
});

/* ================= WATCHLIST ================= */
app.post("/watchlist", auth, async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (user.watchlist.some(m => m.movieId === req.body.movieId))
    return res.json({ error: "Already added" });

  user.watchlist.push(req.body);
  await user.save();
  res.json({ message: "Added to watchlist" });
});

app.get("/watchlist", auth, async (req, res) => {
  const user = await User.findById(req.user.userId);
  res.json(user.watchlist);
});

app.delete("/watchlist/:movieId", auth, async (req, res) => {
  const user = await User.findById(req.user.userId);
  user.watchlist = user.watchlist.filter(
    m => m.movieId !== req.params.movieId
  );
  await user.save();
  res.json({ message: "Removed from watchlist" });
});

/* ================= ADMIN ================= */

// GET ALL USERS
app.get("/admin/users", auth, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });

  const users = await User.find({}, "username role");
  res.json(users);
});

// GET ALL REVIEWS (ADMIN)
app.get("/admin/reviews-all", auth, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });

  const reviews = await Review.find().sort({ createdAt: -1 });
  res.json(reviews);
});

app.get("/admin/stats", auth, async (req, res) => {
  const users = await User.countDocuments();
  const reviews = await Review.countDocuments();

  const usersWithWatchlists = await User.find(
    { watchlist: { $exists: true, $ne: [] } },
    { watchlist: 1 }
  );

  const watchlist = usersWithWatchlists.reduce(
    (sum, u) => sum + u.watchlist.length,
    0
  );

  res.json({ users, reviews, watchlist });
});

app.get("/similar/:genre", async (req, res) => {
  try {
    const genre = req.params.genre;
    const r = await fetch(
      `https://www.omdbapi.com/?apikey=${OMDB_KEY}&s=${encodeURIComponent(genre)}`
    );
    const data = await r.json();
    res.json(data.Search || []);
  } catch {
    res.json([]);
  }
});

app.get("/suggest/:q", async (req, res) => {
  const q = encodeURIComponent(req.params.q);
  const r = await fetch(
    `https://www.omdbapi.com/?apikey=cfd54802&s=${q}`
  );
  const d = await r.json();
  res.json(d.Search || []);
});

app.post("/review/like/:id", auth, async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, {
      $inc: { likes: 1 }
    });
    res.json({ message: "Liked" });
  } catch (err) {
    res.status(500).json({ error: "Like failed" });
  }
});

app.post("/episode-review", auth, async (req, res) => {
  try {

    const existing = await EpisodeReview.findOne({
      series: req.body.series,
      season: req.body.season,
      episode: req.body.episode,
      userId: req.user.userId
    });

    if (existing) {
      return res.json({ message: "You already rated this episode" });
    }

    const review = new EpisodeReview({
      series: req.body.series,
      season: req.body.season,
      episode: req.body.episode,
      rating: req.body.rating,
      userId: req.user.userId,
      username: req.user.username
    });

    await review.save();

    res.json({ message: "Episode rated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/episode-average", async (req, res) => {

  const { series, season, episode } = req.query;

  const reviews = await EpisodeReview.find({
    series,
    season,
    episode
  });

  if (!reviews.length) {
    return res.json({ average: "No ratings yet" });
  }

  const avg =
    reviews.reduce((sum, r) => sum + r.rating, 0) /
    reviews.length;

  res.json({ average: avg.toFixed(1) });

});

app.get("/top-movies", async (req,res)=>{

 const top = await Review.aggregate([
   {
     $group:{
       _id:"$movieTitle",
       avgRating:{ $avg:"$rating" },
       count:{ $sum:1 }
     }
   },
   { $sort:{ avgRating:-1 } },
   { $limit:5 }
 ]);

 res.json(top);

});

app.get("/latest-reviews", async (req,res)=>{

 const reviews = await Review.find()
  .sort({ _id:-1 })
  .limit(5);

 res.json(reviews);

});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});