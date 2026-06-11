const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    enum: ['nvapi', 'openai', 'gemini', 'fallback', null],
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

conversationSchema.pre('save', function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Conversation', conversationSchema);
