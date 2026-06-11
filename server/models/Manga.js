const mongoose = require('mongoose');

const mangaSchema = new mongoose.Schema({
  malId: { type: Number, unique: true, sparse: true },
  title: { type: String, required: true },
  titleEnglish: String,
  titleJapanese: String,
  synopsis: String,
  type: String,
  chapters: Number,
  volumes: Number,
  status: String,
  authors: [{ name: String, malId: Number }],
  serializations: [{ type: String }],
  genres: [{ type: String }],
  themes: [{ type: String }],
  demographics: [{ type: String }],
  score: Number,
  scoredBy: Number,
  rank: Number,
  popularity: Number,
  members: Number,
  favorites: Number,
  imageUrl: String,
  url: String,
  published: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

mangaSchema.index({ title: 'text', synopsis: 'text' });
mangaSchema.index({ genres: 1 });
mangaSchema.index({ score: -1 });
mangaSchema.index({ rank: 1 });

module.exports = mongoose.model('Manga', mangaSchema);
