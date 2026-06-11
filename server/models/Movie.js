const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  originalTitle: String,
  imdbId: String,
  posterUrl: String,
  backdropUrl: String,
  synopsis: String,
  genres: [{ type: String }],
  releaseYear: Number,
  runtime: Number, // in minutes
  rating: Number, // out of 10
  director: String,
  cast: [{ type: String }],
  streamingAvailability: [{
    platform: { type: String, required: true },
    logoUrl: String,
    url: String,
    region: { type: String, required: true } // 'IN', 'US', 'UK', etc.
  }],
  redirectLinks: [{
    siteName: { type: String, required: true }, // 'HDHub4u', 'VegaMovies', etc.
    url: { type: String, required: true }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

movieSchema.index({ title: 'text', synopsis: 'text' });
movieSchema.index({ genres: 1 });
movieSchema.index({ releaseYear: -1 });

module.exports = mongoose.model('Movie', movieSchema);
