const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  quote: { type: String, required: true },
  character: String,
  anime: String,
  episode: Number,
  cachedAt: { type: Date, default: Date.now, expires: 86400 },
});

module.exports = mongoose.model('Quote', quoteSchema);
