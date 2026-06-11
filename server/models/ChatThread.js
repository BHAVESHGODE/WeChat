const mongoose = require('mongoose');

const chatThreadSchema = new mongoose.Schema({
  ghNodeId: { type: String, index: true },
  ghNumber: { type: Number },
  type: { type: String, enum: ['discussion', 'issue'], required: true },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  author: { type: String, default: '' },
  repo: { type: String, required: true },
  labels: [String],
  state: { type: String, default: 'open' },
  isPinned: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  lastActivity: { type: Date },
  participants: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

chatThreadSchema.index({ repo: 1, type: 1, updatedAt: -1 });
chatThreadSchema.index({ isPinned: -1 });
chatThreadSchema.index({ isFavorite: -1 });

module.exports = mongoose.model('ChatThread', chatThreadSchema);
