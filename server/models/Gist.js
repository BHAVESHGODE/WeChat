const mongoose = require('mongoose');

const gistSchema = new mongoose.Schema({
  ghGistId: { type: String, index: true },
  author: { type: String, required: true },
  description: { type: String, default: '' },
  files: [{
    filename: String,
    language: String,
    content: String,
    rawUrl: String,
  }],
  htmlUrl: { type: String },
  public: { type: Boolean, default: true },
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatThread' },
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Gist', gistSchema);
