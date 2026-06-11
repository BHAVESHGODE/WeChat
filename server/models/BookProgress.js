const mongoose = require('mongoose');

const bookProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  sourceId: String,
  source: String,
  title: String,
  author: String,
  coverUrl: String,
  progress: { type: Number, default: 0 },
  totalPages: Number,
  currentPage: { type: Number, default: 0 },
  bookmarks: [{
    label: String,
    cfi: String,
    offset: Number,
    createdAt: { type: Date, default: Date.now },
  }],
  highlights: [{
    text: String,
    note: String,
    offset: Number,
    color: { type: String, default: '#ffeb3b' },
    createdAt: { type: Date, default: Date.now },
  }],
  fontSize: { type: Number, default: 18 },
  fontFamily: { type: String, default: 'serif' },
  theme: { type: String, enum: ['light', 'dark', 'sepia'], default: 'sepia' },
  isFavorite: { type: Boolean, default: false },
  lastReadAt: { type: Date, default: Date.now },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
});

bookProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });
bookProgressSchema.index({ userId: 1, isFavorite: 1 });
bookProgressSchema.index({ userId: 1, lastReadAt: -1 });

module.exports = mongoose.model('BookProgress', bookProgressSchema);
