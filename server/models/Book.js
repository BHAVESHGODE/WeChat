const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  sourceId: { type: String, required: true },
  source: { type: String, enum: ['gutenberg', 'openlibrary', 'googlebooks'], required: true },
  title: { type: String, required: true },
  author: String,
  description: String,
  isbn: String,
  isbn13: String,
  publishYear: Number,
  publisher: String,
  pages: Number,
  language: String,
  subjects: [String],
  coverUrl: String,
  thumbnailUrl: String,
  downloadLinks: {
    epub: String,
    kindle: String,
    pdf: String,
    text: String,
  },
  previewLink: String,
  infoLink: String,
  cachedAt: { type: Date, default: Date.now },
});

bookSchema.index({ sourceId: 1, source: 1 }, { unique: true });
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ subjects: 1 });

module.exports = mongoose.model('Book', bookSchema);
