const mongoose = require('mongoose');

const safeMessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'ai'], required: true },
  text: { type: String, required: true },
  provider: {
    type: String,
    enum: ['nvapi', 'openai', 'gemini', 'fallback', null],
    default: null,
  },
  timestamp: { type: Date, default: Date.now },
});

const safeSpaceSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  messages: [safeMessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

safeSpaceSchema.pre('save', function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('SafeSpace', safeSpaceSchema);
