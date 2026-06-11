const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, default: 'Untitled Note', trim: true },
  content: { type: String, default: '' },
  tags: [{ type: String, trim: true }],
  color: { type: String, default: '#7c4dff' },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

noteSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
