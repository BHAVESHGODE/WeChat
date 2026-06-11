const mongoose = require('mongoose');

const youTubeFavoriteSchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  title: { type: String, required: true },
  artist: { type: String, default: 'Unknown' },
  thumbnail: { type: String, default: '' },
  duration: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  channelId: { type: String, default: '' },
  addedAt: { type: Date, default: Date.now },
});

youTubeFavoriteSchema.index({ videoId: 1 }, { unique: true });
youTubeFavoriteSchema.index({ addedAt: -1 });

module.exports = mongoose.model('YouTubeFavorite', youTubeFavoriteSchema);
