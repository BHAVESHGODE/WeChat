const mongoose = require('mongoose');

const movieWatchlistSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  title: String,
  posterUrl: String,
  status: {
    type: String,
    enum: ['watching', 'completed', 'plan_to_watch', 'dropped'],
    default: 'watching'
  },
  progress: { type: Number, default: 0 }, // progress in minutes
  updatedAt: { type: Date, default: Date.now }
});

movieWatchlistSchema.index({ userId: 1, movieId: 1 }, { unique: true });
movieWatchlistSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('MovieWatchlist', movieWatchlistSchema);
