const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, default: 'Unknown' },
  videoId: { type: String, default: '' },
  duration: { type: Number, default: 0 },
  // Source-specific fields
  source: { type: String, enum: ['youtube', 'gaana', 'itunes', 'jiosaavn', 'lastfm'], default: 'youtube' },
  thumbnail: { type: String, default: '' },
  album: { type: String, default: '' },
  bitrate: { type: Number, default: 0 },
  language: { type: String, default: '' },
  releaseDate: { type: String, default: '' },
  playableLink: { type: String, default: '' },
  lyrics: { type: String, default: '' },
  sourceUrl: { type: String, default: '' },
});

const playlistSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  tracks: [trackSchema],
  createdBy: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now },
});

playlistSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Playlist', playlistSchema);
