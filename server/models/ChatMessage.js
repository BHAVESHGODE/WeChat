const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatThread', required: true, index: true },
  ghCommentId: { type: String },
  ghNodeId: { type: String },
  author: { type: String, required: true },
  authorAvatar: { type: String },
  body: { type: String, required: true },
  bodyHtml: { type: String },
  isReply: { type: Boolean, default: false },
  parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage', default: null },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage' }],
  gistUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

chatMessageSchema.index({ threadId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
