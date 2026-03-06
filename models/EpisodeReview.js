const mongoose = require("mongoose");

const EpisodeReviewSchema = new mongoose.Schema({

  series: String,
  season: Number,
  episode: Number,

  rating: Number,

  userId: String,
  username: String

});

module.exports = mongoose.model("EpisodeReview", EpisodeReviewSchema);