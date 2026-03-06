const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  poster: { type: String, required: true },
  reason: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Recommendation", recommendationSchema);
