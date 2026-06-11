const mongoose = require('mongoose');

const movieFavoriteSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // 'Maverick', 'Bell', 'Goju', 'guest', etc.
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  title: String,
  posterUrl: String,
  createdAt: { type: Date, default: Date.now },
});

movieFavoriteSchema.index({ userId: 1, movieId: 1 }, { unique: true });
movieFavoriteSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('MovieFavorite', movieFavoriteSchema);
