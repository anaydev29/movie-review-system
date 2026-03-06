const mongoose = require("mongoose");

const discussionSchema = new mongoose.Schema({
  movieId: String,
  username: String,
  message: String
}, { timestamps: true });

module.exports = mongoose.model("Discussion", discussionSchema);
