const mongoose = require('mongoose');

const animeSchema = new mongoose.Schema({
  malId: { type: Number, unique: true, sparse: true },
  title: { type: String, required: true },
  titleEnglish: String,
  titleJapanese: String,
  synopsis: String,
  type: String,
  episodes: Number,
  status: String,
  aired: String,
  season: String,
  year: Number,
  genres: [{ type: String }],
  themes: [{ type: String }],
  demographics: [{ type: String }],
  score: Number,
  scoredBy: Number,
  rank: Number,
  popularity: Number,
  members: Number,
  favorites: Number,
  rating: String,
  imageUrl: String,
  trailerUrl: String,
  url: String,
  broadcast: String,
  source: String,
  duration: String,
  studios: [{ type: String }],
  producers: [{ type: String }],
  licensors: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

animeSchema.index({ title: 'text', synopsis: 'text' });
animeSchema.index({ genres: 1 });
animeSchema.index({ score: -1 });
animeSchema.index({ rank: 1 });

module.exports = mongoose.model('Anime', animeSchema);
