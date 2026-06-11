const mongoose = require('mongoose');

const streamingLinkSchema = new mongoose.Schema({
  animeId: { type: String, required: true },
  source: { type: String, default: 'gogoanime' },
  title: { type: String, default: '' },
  episodes: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' },
  cachedAt: { type: Date, default: Date.now },
});

streamingLinkSchema.index({ animeId: 1, source: 1 }, { unique: true });

module.exports = mongoose.model('StreamingLink', streamingLinkSchema);
