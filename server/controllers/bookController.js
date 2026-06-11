const axios = require('axios');
const Book = require('../models/Book');
const BookProgress = require('../models/BookProgress');

const OPENLIB = 'https://openlibrary.org';
const GUTENDEX = 'https://gutendex.com';
const GB_API = 'https://www.googleapis.com/books/v1';
const CACHE_TTL = 24 * 60 * 60 * 1000;

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function mapOpenLibrary(work) {
  const id = work.key?.replace('/works/', '');
  return {
    sourceId: id,
    source: 'openlibrary',
    title: work.title || 'Unknown',
    author: work.authors?.[0]?.name || work.author_name?.[0] || 'Unknown',
    description: work.description || work.first_sentence?.[0] || '',
    isbn: work.isbn?.[0] || null,
    publishYear: work.first_publish_year || null,
    subjects: work.subject?.slice(0, 10) || work.subjects?.slice(0, 10) || [],
    coverUrl: work.cover_i
      ? `https://covers.openlibrary.org/b/id/${work.cover_i}-L.jpg`
      : null,
    thumbnailUrl: work.cover_i
      ? `https://covers.openlibrary.org/b/id/${work.cover_i}-S.jpg`
      : null,
    pages: work.number_of_pages_median || null,
    sourceUrl: `https://openlibrary.org/works/${id}`,
  };
}

function mapGoogleBook(vol) {
  const info = vol.volumeInfo || {};
  const id = vol.id;
  const identifiers = info.industryIdentifiers || [];
  const isbn13 = identifiers.find((i) => i.type === 'ISBN_13')?.identifier;
  const isbn10 = identifiers.find((i) => i.type === 'ISBN_10')?.identifier;
  return {
    sourceId: id,
    source: 'googlebooks',
    title: info.title || 'Unknown',
    author: info.authors?.[0] || 'Unknown',
    description: info.description?.replace(/<[^>]*>/g, '').substring(0, 1000) || '',
    isbn: isbn10 || null,
    isbn13: isbn13 || null,
    publishYear: info.publishedDate?.substring(0, 4) || null,
    publisher: info.publisher || null,
    pages: info.pageCount || null,
    subjects: info.categories?.slice(0, 10) || [],
    coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:')?.replace('&zoom=1', '&zoom=2') || null,
    thumbnailUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
    previewLink: info.previewLink || null,
    infoLink: info.infoLink || null,
    sourceUrl: info.infoLink || null,
  };
}

function mapGutenberg(book) {
  const id = book.id;
  const formats = book.formats || {};
  return {
    sourceId: String(id),
    source: 'gutenberg',
    title: book.title?.replace(/\s+/g, ' ').trim() || 'Unknown',
    author: book.authors?.[0]?.name?.replace(/\s+/g, ' ').trim() || 'Unknown',
    description: book.summaries?.[0]?.substring(0, 1000) || '',
    publishYear: book.download_count ? null : null,
    subjects: (book.subjects || []).concat(book.bookshelves || []).slice(0, 10),
    coverUrl: formats['image/jpeg'] ? `https://gutenberg.org/cache/epub/${id}/pg${id}.cover.medium.jpg` : null,
    thumbnailUrl: formats['image/jpeg'] ? `https://gutenberg.org/cache/epub/${id}/pg${id}.cover.small.jpg` : null,
    pages: null,
    downloadLinks: {
      epub: formats['application/epub+zip'] || null,
      kindle: formats['application/x-mobipocket-ebook'] || null,
      pdf: formats['application/pdf'] || null,
      text: formats['text/plain; charset=utf-8'] || formats['text/plain'] || null,
    },
    sourceUrl: `https://gutenberg.org/ebooks/${id}`,
  };
}

async function fetchFromCache(sourceId, source) {
  const cached = await Book.findOne({ sourceId, source });
  if (cached && Date.now() - cached.cachedAt.getTime() < CACHE_TTL) {
    return cached.toObject();
  }
  return null;
}

async function saveToCache(bookData) {
  try {
    await Book.findOneAndUpdate(
      { sourceId: bookData.sourceId, source: bookData.source },
      { ...bookData, cachedAt: new Date() },
      { upsert: true, new: true }
    );
  } catch (e) {
  }
}

async function searchBooks(req, res) {
  try {
    const { q, source, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query is required' });

    const sources = source ? [source] : ['openlibrary', 'gutenberg', 'googlebooks'];
    const results = [];

    for (const src of sources) {
      try {
        if (src === 'openlibrary') {
          const { data } = await axios.get(`${OPENLIB}/search.json`, {
            params: { q, page: parseInt(page), limit: Math.min(parseInt(limit), 50) },
            timeout: 15000,
          });
          const docs = (data.docs || []).slice(0, 20);
          results.push(...docs.map(mapOpenLibrary));
        } else if (src === 'gutenberg') {
          const { data } = await axios.get(`${GUTENDEX}/books`, {
            params: { search: q, page: parseInt(page) },
            timeout: 15000,
          });
          const books = (data.results || []).slice(0, 20);
          results.push(...books.map(mapGutenberg));
        } else if (src === 'googlebooks') {
          const { data } = await axios.get(`${GB_API}/volumes`, {
            params: { q, startIndex: (parseInt(page) - 1) * parseInt(limit), maxResults: Math.min(parseInt(limit), 40) },
            timeout: 15000,
          });
          const items = (data.items || []).slice(0, 20);
          results.push(...items.map(mapGoogleBook));
        }
      } catch (e) {
        console.error(`${src} search error:`, e.message);
      }
    }

    res.json({ data: results, total: results.length, page: parseInt(page) });
  } catch (err) {
    console.error('Book search error:', err.message);
    res.status(500).json({ error: 'Failed to search books' });
  }
}

async function getBookById(req, res) {
  try {
    const { id } = req.params;
    const { source } = req.query;

    if (!source) return res.status(400).json({ error: 'Source parameter is required' });

    const cached = await fetchFromCache(id, source);
    if (cached) return res.json({ data: cached });

    let bookData;

    if (source === 'openlibrary') {
      const { data } = await axios.get(`${OPENLIB}/works/${id}.json`, { timeout: 15000 });
      const { data: searchData } = await axios.get(`${OPENLIB}/search.json`, {
        params: { q: data.title, limit: 1 },
        timeout: 15000,
      });
      const doc = searchData.docs?.[0] || {};
      bookData = mapOpenLibrary({ ...doc, key: `/works/${id}`, title: data.title, description: data.description?.value || data.description });
    } else if (source === 'gutenberg') {
      const { data } = await axios.get(`${GUTENDEX}/books/${id}`, { timeout: 15000 });
      bookData = mapGutenberg(data);
    } else if (source === 'googlebooks') {
      const { data } = await axios.get(`${GB_API}/volumes/${id}`, { timeout: 15000 });
      bookData = mapGoogleBook(data);
    } else {
      return res.status(400).json({ error: 'Invalid source' });
    }

    if (!bookData) return res.status(404).json({ error: 'Book not found' });

    saveToCache(bookData);
    res.json({ data: bookData });
  } catch (err) {
    console.error('Book detail error:', err.message);
    res.status(500).json({ error: 'Failed to get book details' });
  }
}

async function getBookText(req, res) {
  try {
    const { id } = req.params;
    const { source = 'gutenberg' } = req.query;

    if (source === 'gutenberg') {
      const urls = [
        `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
        `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
        `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`,
      ];

      for (const url of urls) {
        try {
          const { data } = await axios.get(url, { timeout: 30000, responseType: 'text' });
          const lines = data.split('\n');
          const startIdx = lines.findIndex((l) => l.includes('*** START OF THE PROJECT GUTENBERG'));
          const endIdx = lines.findIndex((l) => l.includes('*** END OF THE PROJECT GUTENBERG'));
          const content = startIdx >= 0 && endIdx > startIdx
            ? lines.slice(startIdx + 1, endIdx).join('\n').trim()
            : data.substring(0, 500000);
          return res.json({ data: { text: content, totalChars: content.length, source: url } });
        } catch (e) {
          continue;
        }
      }
      return res.status(404).json({ error: 'Could not fetch book text from Gutenberg' });
    }

    if (source === 'openlibrary') {
      try {
        const { data: workData } = await axios.get(`${OPENLIB}/works/${id}.json`, { timeout: 15000 });
        const desc = workData.description?.value || workData.description || '';
        const excerpt = typeof desc === 'string' ? desc.substring(0, 10000) : '';
        const { data: edData } = await axios.get(`${OPENLIB}/works/${id}/editions.json?limit=5`, { timeout: 15000 });
        const edition = edData.entries?.[0];
        const iaId = edition?.ia?.[0] || edition?.identifiers?.ia?.[0] || null;
        let externalReaderUrl = `https://openlibrary.org/works/${id}`;
        let externalReaderLabel = 'Open Library';

        if (iaId) {
          externalReaderUrl = `https://archive.org/details/${iaId}`;
          externalReaderLabel = 'Internet Archive';
        }

        return res.json({
          data: {
            text: excerpt || 'No full text available for this OpenLibrary book. Use the external reader link.',
            totalChars: excerpt.length,
            source: `openlibrary:${id}`,
            externalReaderUrl,
            externalReaderLabel,
            iaId,
          },
        });
      } catch (e) {
        return res.status(404).json({ error: 'Could not fetch OpenLibrary book details' });
      }
    }

    if (source === 'googlebooks') {
      try {
        const { data } = await axios.get(`${GB_API}/volumes/${id}`, {
          params: { projection: 'FULL' },
          timeout: 15000,
        });
        const info = data.volumeInfo || {};
        const accessInfo = data.accessInfo || {};
        const desc = (info.description || '').replace(/<[^>]*>/g, '').substring(0, 10000);
        const previewLink = accessInfo.webReaderLink || info.previewLink || null;
        const embeddable = accessInfo.embeddable || false;
        const publicDomain = accessInfo.publicDomain || false;
        const viewability = accessInfo.viewability || 'NO_PREVIEW';

        return res.json({
          data: {
            text: desc || (viewability !== 'NO_PREVIEW' ? 'This book has a preview available. Open the external reader.' : 'No preview available for this book.'),
            totalChars: desc.length,
            source: `googlebooks:${id}`,
            externalReaderUrl: previewLink,
            externalReaderLabel: 'Google Books Preview',
            embeddable,
            publicDomain,
            viewability,
          },
        });
      } catch (e) {
        return res.status(404).json({ error: 'Could not fetch Google Books details' });
      }
    }

    res.status(400).json({ error: 'Invalid source' });
  } catch (err) {
    console.error('Book text error:', err.message);
    res.status(500).json({ error: 'Failed to get book text' });
  }
}

async function getRelatedBooks(req, res) {
  try {
    const { id, source } = req.query;
    if (!source) return res.status(400).json({ error: 'Source is required' });

    const cached = await fetchFromCache(id, source);
    if (!cached) return res.json({ data: [] });

    const { data } = await axios.get(`${OPENLIB}/search.json`, {
      params: { q: cached.author || cached.title, limit: 12 },
      timeout: 15000,
    });
    const related = (data.docs || [])
      .filter((d) => d.key !== `/works/${id}`)
      .slice(0, 10)
      .map(mapOpenLibrary);

    res.json({ data: related });
  } catch (err) {
    console.error('Related books error:', err.message);
    res.status(500).json({ error: 'Failed to get related books' });
  }
}

async function saveProgress(req, res) {
  try {
    const { userId, bookId, sourceId, source, title, author, coverUrl, progress, totalPages, currentPage, fontSize, fontFamily, theme, isFavorite } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const filter = bookId ? { userId, bookId } : { userId, sourceId, source };
    const update = {
      ...(title && { title }),
      ...(author && { author }),
      ...(coverUrl && { coverUrl }),
      ...(progress !== undefined && { progress }),
      ...(totalPages !== undefined && { totalPages }),
      ...(currentPage !== undefined && { currentPage }),
      ...(fontSize && { fontSize }),
      ...(fontFamily && { fontFamily }),
      ...(theme && { theme }),
      ...(isFavorite !== undefined && { isFavorite }),
      lastReadAt: new Date(),
    };

    if (progress === 100) update.completedAt = new Date();

    const entry = await BookProgress.findOneAndUpdate(filter, update, { upsert: true, new: true });
    res.json({ data: entry });
  } catch (err) {
    console.error('Book progress save error:', err.message);
    if (err.code === 11000) return res.status(409).json({ error: 'Progress entry exists' });
    res.status(500).json({ error: 'Failed to save progress' });
  }
}

async function addBookmark(req, res) {
  try {
    const { userId, bookId, sourceId, source, label, offset } = req.body;
    if (!userId || !bookId) return res.status(400).json({ error: 'userId and bookId are required' });

    const filter = { userId, bookId };
    const entry = await BookProgress.findOne(filter);
    if (!entry) return res.status(404).json({ error: 'No progress entry found. Save progress first.' });

    entry.bookmarks.push({ label: label || `Page ${offset}`, offset: offset || 0 });
    await entry.save();
    res.json({ data: entry });
  } catch (err) {
    console.error('Bookmark add error:', err.message);
    res.status(500).json({ error: 'Failed to add bookmark' });
  }
}

async function removeBookmark(req, res) {
  try {
    const { userId, bookId, bookmarkId } = req.body;
    if (!userId || !bookId || !bookmarkId) return res.status(400).json({ error: 'userId, bookId, and bookmarkId are required' });

    const entry = await BookProgress.findOneAndUpdate(
      { userId, bookId },
      { $pull: { bookmarks: { _id: bookmarkId } } },
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json({ data: entry });
  } catch (err) {
    console.error('Bookmark remove error:', err.message);
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
}

async function addHighlight(req, res) {
  try {
    const { userId, bookId, sourceId, source, text, note, offset, color } = req.body;
    if (!userId || !bookId || !text) return res.status(400).json({ error: 'userId, bookId, and text are required' });

    const filter = { userId, bookId };
    const entry = await BookProgress.findOne(filter);
    if (!entry) return res.status(404).json({ error: 'No progress entry found. Save progress first.' });

    entry.highlights.push({ text, note: note || '', offset: offset || 0, color: color || '#ffeb3b' });
    await entry.save();
    res.json({ data: entry });
  } catch (err) {
    console.error('Highlight add error:', err.message);
    res.status(500).json({ error: 'Failed to add highlight' });
  }
}

async function removeHighlight(req, res) {
  try {
    const { userId, bookId, highlightId } = req.body;
    if (!userId || !bookId || !highlightId) return res.status(400).json({ error: 'userId, bookId, and highlightId are required' });

    const entry = await BookProgress.findOneAndUpdate(
      { userId, bookId },
      { $pull: { highlights: { _id: highlightId } } },
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json({ data: entry });
  } catch (err) {
    console.error('Highlight remove error:', err.message);
    res.status(500).json({ error: 'Failed to remove highlight' });
  }
}

async function getProgress(req, res) {
  try {
    const { userId, bookId, sourceId, source } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const filter = { userId };
    if (bookId) filter.bookId = bookId;
    else if (sourceId && source) {
      filter.sourceId = sourceId;
      filter.source = source;
    }

    const entries = await BookProgress.find(filter).sort({ lastReadAt: -1 });
    res.json({ data: entries });
  } catch (err) {
    console.error('Book progress get error:', err.message);
    res.status(500).json({ error: 'Failed to get progress' });
  }
}

async function deleteProgress(req, res) {
  try {
    const { userId, bookId } = req.query;
    if (!userId || !bookId) return res.status(400).json({ error: 'userId and bookId are required' });

    const entry = await BookProgress.findOneAndDelete({ userId, bookId });
    if (!entry) return res.status(404).json({ error: 'Progress entry not found' });
    res.json({ message: 'Removed from library' });
  } catch (err) {
    console.error('Book progress delete error:', err.message);
    res.status(500).json({ error: 'Failed to remove book' });
  }
}

module.exports = {
  searchBooks,
  getBookById,
  getBookText,
  getRelatedBooks,
  saveProgress,
  addBookmark,
  removeBookmark,
  addHighlight,
  removeHighlight,
  getProgress,
  deleteProgress,
};
