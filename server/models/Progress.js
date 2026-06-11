const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemType: { type: String, enum: ['anime', 'manga'], required: true },
  itemId: { type: String, required: true },
  source: { type: String, default: 'mal' },
  title: String,
  imageUrl: String,
  genres: [String],
  score: Number,
  totalItems: Number,
  currentItem: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['watching', 'reading', 'completed', 'on_hold', 'dropped', 'plan_to_watch', 'plan_to_read'],
    default: 'watching',
  },
  startedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: Date,
  notes: String,
});

progressSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });
progressSchema.index({ userId: 1, status: 1 });
progressSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Progress', progressSchema);
