const axios = require('axios');

const MD_API = 'https://api.mangadex.org';
const MD_IMAGE = 'https://uploads.mangadex.org';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function mdRequest(endpoint, params = {}) {
  try {
    const { data } = await axios.get(`${MD_API}${endpoint}`, {
      params,
      headers: { 'User-Agent': 'WeGift/1.0' },
      timeout: 15000,
    });
    return data;
  } catch (err) {
    if (err.response?.status === 429) {
      await delay(1000);
      return mdRequest(endpoint, params);
    }
    throw err;
  }
}

function extractCover(manga) {
  const filename = manga.relationships?.find((r) => r.type === 'cover_art')?.attributes?.fileName;
  if (!filename) return null;
  const base = filename.replace(/\.\w+$/, '');
  return `${MD_IMAGE}/covers/${manga.id}/${base}.512.jpg`;
}

function mapManga(manga) {
  const attrs = manga.attributes || {};
  const tags = attrs.tags?.map((t) => t.attributes?.name?.en).filter(Boolean) || [];
  return {
    id: manga.id,
    malId: null,
    title: attrs.title?.en || Object.values(attrs.title || {})[0] || 'Unknown',
    altTitles: attrs.altTitles?.map((t) => Object.values(t)[0]) || [],
    synopsis: attrs.description?.en?.replace(/<[^>]*>/g, '').substring(0, 500) || '',
    status: attrs.status || 'unknown',
    year: attrs.year,
    genres: tags,
    rating: null,
    score: null,
    chapters: attrs.lastChapter ? parseFloat(attrs.lastChapter) : null,
    volumes: attrs.lastVolume ? parseFloat(attrs.lastVolume) : null,
    imageUrl: extractCover(manga),
    url: `https://mangadex.org/title/${manga.id}`,
    source: 'mangadex',
    contentRating: attrs.contentRating,
    publicationDemographic: attrs.publicationDemographic,
    updatedAt: attrs.updatedAt,
  };
}

async function searchMangaDex(req, res) {
  try {
    const { q, limit = 20, offset = 0, status, genres, rating } = req.query;
    const params = {
      limit: Math.min(parseInt(limit), 50),
      offset: parseInt(offset),
      includes: ['cover_art'],
    };
    if (q) params.title = q;
    if (status) params.status = status;
    if (genres) params.includedTags = genres.split(',');
    if (rating) params.contentRating = rating.split(',');

    const data = await mdRequest('/manga', params);
    const mangaList = (data.data || []).map((m) => mapManga(m));
    res.json({ data: mangaList, total: data.total, offset: data.offset, limit: data.limit });
  } catch (err) {
    console.error('MangaDex search error:', err.message);
    res.status(500).json({ error: 'Failed to search MangaDex' });
  }
}

async function getMangaById(req, res) {
  try {
    const { id } = req.params;
    const data = await mdRequest(`/manga/${id}`, { includes: ['cover_art', 'author', 'artist'] });
    const manga = data.data;
    if (!manga) return res.status(404).json({ error: 'Manga not found' });

    const attrs = manga.attributes || {};
    const tags = attrs.tags?.map((t) => t.attributes?.name?.en).filter(Boolean) || [];
    const authors = manga.relationships?.filter((r) => r.type === 'author' || r.type === 'artist')
      .map((r) => ({ name: r.attributes?.name || 'Unknown', role: r.type })) || [];

    const result = {
      id: manga.id,
      title: attrs.title?.en || Object.values(attrs.title || {})[0] || 'Unknown',
      altTitles: attrs.altTitles?.map((t) => Object.values(t)[0]) || [],
      synopsis: attrs.description?.en?.replace(/<[^>]*>/g, '').substring(0, 2000) || '',
      status: attrs.status || 'unknown',
      year: attrs.year,
      genres: tags,
      chapters: attrs.lastChapter ? parseFloat(attrs.lastChapter) : null,
      volumes: attrs.lastVolume ? parseFloat(attrs.lastVolume) : null,
      imageUrl: extractCover(manga),
      authors,
      url: `https://mangadex.org/title/${manga.id}`,
      contentRating: attrs.contentRating,
      publicationDemographic: attrs.publicationDemographic,
      source: 'mangadex',
    };

    res.json({ data: result });
  } catch (err) {
    console.error('MangaDex detail error:', err.message);
    res.status(500).json({ error: 'Failed to get manga details' });
  }
}

async function getMangaChapters(req, res) {
  try {
    const { id } = req.params;
    const { limit = 100, offset = 0, lang = 'en' } = req.query;

    const data = await mdRequest(`/manga/${id}/feed`, {
      limit: Math.min(parseInt(limit), 500),
      offset: parseInt(offset),
      translatedLanguage: [lang],
      order: { chapter: 'desc' },
      includes: ['scanlation_group'],
    });

    const chapters = (data.data || []).map((ch) => {
      const attrs = ch.attributes || {};
      const group = ch.relationships?.find((r) => r.type === 'scanlation_group');
      return {
        id: ch.id,
        chapter: attrs.chapter ? parseFloat(attrs.chapter) : null,
        title: attrs.title || '',
        volume: attrs.volume ? parseFloat(attrs.volume) : null,
        lang: attrs.translatedLanguage,
        pages: attrs.pages,
        group: group?.attributes?.name || 'Unknown',
        publishedAt: attrs.publishAt,
      };
    });

    res.json({ data: chapters, total: data.total, offset: data.offset, limit: data.limit });
  } catch (err) {
    console.error('MangaDex chapters error:', err.message);
    res.status(500).json({ error: 'Failed to get chapters' });
  }
}

async function getChapterPages(req, res) {
  try {
    const { id } = req.params;
    const { data } = await axios.get(`${MD_API}/at-home/server/${id}`, {
      timeout: 10000,
    });
    const baseUrl = data.baseUrl || 'https://uploads.mangadex.org';
    const chapter = data.chapter || {};
    const hash = chapter.hash;
    const pages = (chapter.data || []).map((p) => ({
      url: `${baseUrl}/data/${hash}/${p}`,
      filename: p,
    }));
    const pagesSd = (chapter.dataSaver || []).map((p) => ({
      url: `${baseUrl}/data-saver/${hash}/${p}`,
      filename: p,
    }));
    res.json({ data: { pages, pagesSd, hash, baseUrl } });
  } catch (err) {
    console.error('MangaDex pages error:', err.message);
    res.status(500).json({ error: 'Failed to get chapter pages' });
  }
}

async function getMangaGenres(req, res) {
  try {
    const data = await mdRequest('/manga/tag');
    const genres = (data.data || []).map((tag) => ({
      id: tag.id,
      name: tag.attributes?.name?.en || 'Unknown',
      group: tag.attributes?.group || 'genre',
    }));
    res.json({ data: genres });
  } catch (err) {
    console.error('MangaDex genres error:', err.message);
    res.status(500).json({ error: 'Failed to get genres' });
  }
}

async function getMangaList(req, res) {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const data = await mdRequest('/manga', {
      limit: Math.min(parseInt(limit), 50),
      offset: parseInt(offset),
      includes: ['cover_art'],
      order: { followedCount: 'desc' },
      availableTranslatedLanguage: ['en'],
      hasAvailableChapters: 'true',
    });
    const mangaList = (data.data || []).map((m) => mapManga(m));
    res.json({ data: mangaList, total: data.total, offset: data.offset, limit: data.limit });
  } catch (err) {
    console.error('MangaDex list error:', err.message);
    res.status(500).json({ error: 'Failed to get manga list' });
  }
}

module.exports = {
  searchMangaDex,
  getMangaById,
  getMangaChapters,
  getChapterPages,
  getMangaGenres,
  getMangaList,
};
