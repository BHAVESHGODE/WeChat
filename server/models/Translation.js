const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema({
  sourceId: { type: String, required: true },
  sourceType: { type: String, enum: ['manga', 'chapter'], required: true },
  language: { type: String, default: 'en' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  cachedAt: { type: Date, default: Date.now },
});

translationSchema.index({ sourceId: 1, sourceType: 1, language: 1 }, { unique: true });

module.exports = mongoose.model('Translation', translationSchema);
