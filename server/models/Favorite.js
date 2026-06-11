const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  itemType: { type: String, enum: ['anime', 'manga', 'character'], required: true },
  itemId: { type: Number, required: true },
  title: String,
  imageUrl: String,
  score: Number,
  type: String,
  genres: [{ type: String }],
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

favoriteSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });
favoriteSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Favorite', favoriteSchema);
