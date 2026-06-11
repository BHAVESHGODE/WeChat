const mongoose = require('mongoose');

const translationCacheSchema = new mongoose.Schema({
  textHash: { type: String, required: true, unique: true },
  sourceText: String,
  translatedText: String,
  sourceLang: String,
  targetLang: String,
  createdAt: { type: Date, default: Date.now, expires: 86400 * 30 },
});

module.exports = mongoose.model('TranslationCache', translationCacheSchema);
