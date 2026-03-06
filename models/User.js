const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },

  watchlist: [
    {
      movieId: String,
      title: String,
      poster: String
    }
  ]
});

module.exports = mongoose.model("User", userSchema);
