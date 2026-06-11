const mongoose = require('mongoose');

const youTubeTrackSchema = new mongoose.Schema({
  videoId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  artist: { type: String, default: 'Unknown' },
  thumbnail: { type: String, default: '' },
  duration: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  description: { type: String, default: '' },
  channelId: { type: String, default: '' },
  publishedAt: { type: String, default: '' },
  source: { type: String, default: 'adyoutube' },
  cachedAt: { type: Date, default: Date.now },
});

youTubeTrackSchema.index({ videoId: 1 });
youTubeTrackSchema.index({ title: 'text', artist: 'text' });

module.exports = mongoose.model('YouTubeTrack', youTubeTrackSchema);
