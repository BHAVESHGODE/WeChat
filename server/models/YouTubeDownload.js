const mongoose = require('mongoose');

const youTubeDownloadSchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  title: { type: String, required: true },
  artist: { type: String, default: 'Unknown' },
  thumbnail: { type: String, default: '' },
  duration: { type: Number, default: 0 },
  filePath: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  format: { type: String, enum: ['audio', 'video'], default: 'audio' },
  quality: { type: String, default: 'medium' },
  downloadedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
});

youTubeDownloadSchema.index({ videoId: 1 });
youTubeDownloadSchema.index({ downloadedAt: -1 });

module.exports = mongoose.model('YouTubeDownload', youTubeDownloadSchema);
