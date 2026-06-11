const mongoose = require('mongoose');

const watchListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemType: { type: String, enum: ['anime', 'manga'], required: true },
  itemId: { type: Number, required: true },
  title: String,
  imageUrl: String,
  score: Number,
  type: String,
  genres: [String],
  status: { type: String, enum: ['watching', 'completed', 'plan_to_watch', 'on_hold', 'dropped'], default: 'watching' },
  progress: { type: Number, default: 0 },
  total: Number,
  startedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

watchListSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });
watchListSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('WatchList', watchListSchema);
