const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  game: { type: String, required: true },
  score: { type: Number, required: true },
  playedAt: { type: Date, default: Date.now },
});

scoreSchema.index({ userId: 1, game: 1 });

module.exports = mongoose.model('Score', scoreSchema);
