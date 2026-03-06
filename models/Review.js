const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  movieId: String,
  movieTitle: String,
  rating: Number,
  comment: String,
  userId: String,
  username: String,

  likes: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("Review", ReviewSchema);