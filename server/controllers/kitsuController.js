const axios = require('axios');

const KITSU = 'https://kitsu.io/api/edge';

async function kitsuRequest(endpoint, params = {}) {
  try {
    const { data } = await axios.get(`${KITSU}${endpoint}`, {
      params,
      headers: { 'Accept': 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json' },
      timeout: 10000,
    });
    return data;
  } catch (err) {
    if (err.response?.status === 429) {
      await new Promise((r) => setTimeout(r, 1000));
      return kitsuRequest(endpoint, params);
    }
    throw err;
  }
}

function mapAnime(entry) {
  const a = entry.attributes || {};
  return {
    id: entry.id,
    slug: a.slug,
    title: a.canonicalTitle || a.titles?.en || a.titles?.en_jp || 'Unknown',
    titles: a.titles || {},
    synopsis: a.synopsis?.replace(/<[^>]*>/g, '').substring(0, 500) || '',
    episodes: a.episodeCount,
    episodeLength: a.episodeLength,
    status: a.status,
    ageRating: a.ageRating,
    startDate: a.startDate,
    endDate: a.endDate,
    score: a.averageRating ? parseFloat(a.averageRating) / 10 : null,
    popularity: a.userCount,
    favoritesCount: a.favoritesCount,
    genres: [],
    imageUrl: a.posterImage?.large || a.posterImage?.original,
    coverImage: a.coverImage?.large,
    nsfw: a.nsfw,
    source: 'kitsu',
  };
}

function mapManga(entry) {
  const a = entry.attributes || {};
  return {
    id: entry.id,
    slug: a.slug,
    title: a.canonicalTitle || a.titles?.en || a.titles?.en_jp || 'Unknown',
    titles: a.titles || {},
    synopsis: a.synopsis?.replace(/<[^>]*>/g, '').substring(0, 500) || '',
    chapters: a.chapterCount,
    volumes: a.volumeCount,
    status: a.status,
    startDate: a.startDate,
    endDate: a.endDate,
    score: a.averageRating ? parseFloat(a.averageRating) / 10 : null,
    popularity: a.userCount,
    imageUrl: a.posterImage?.large || a.posterImage?.original,
    coverImage: a.coverImage?.large,
    serialization: a.serialization,
    source: 'kitsu',
  };
}

async function searchAnime(req, res) {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query required' });

    const data = await kitsuRequest('/anime', {
      'filter[text]': q,
      'page[limit]': Math.min(parseInt(limit), 20),
      'page[offset]': (parseInt(page) - 1) * parseInt(limit),
    });
    const anime = (data.data || []).map(mapAnime);
    res.json({ data: anime, meta: data.meta });
  } catch (err) {
    console.error('Kitsu anime search error:', err.message);
    res.status(500).json({ error: 'Failed to search Kitsu anime' });
  }
}

async function searchManga(req, res) {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query required' });

    const data = await kitsuRequest('/manga', {
      'filter[text]': q,
      'page[limit]': Math.min(parseInt(limit), 20),
      'page[offset]': (parseInt(page) - 1) * parseInt(limit),
    });
    const manga = (data.data || []).map(mapManga);
    res.json({ data: manga, meta: data.meta });
  } catch (err) {
    console.error('Kitsu manga search error:', err.message);
    res.status(500).json({ error: 'Failed to search Kitsu manga' });
  }
}

async function getTrendingAnime(req, res) {
  try {
    const data = await kitsuRequest('/trending/anime', { 'page[limit]': 20 });
    const anime = (data.data || []).map(mapAnime);
    res.json({ data: anime });
  } catch (err) {
    console.error('Kitsu trending error:', err.message);
    res.status(500).json({ error: 'Failed to get trending' });
  }
}

async function getTrendingManga(req, res) {
  try {
    const data = await kitsuRequest('/trending/manga', { 'page[limit]': 20 });
    const manga = (data.data || []).map(mapManga);
    res.json({ data: manga });
  } catch (err) {
    console.error('Kitsu trending manga error:', err.message);
    res.status(500).json({ error: 'Failed to get trending manga' });
  }
}

async function getAnimeById(req, res) {
  try {
    const { id } = req.params;
    const data = await kitsuRequest(`/anime/${id}`, { include: 'genres,categories,mediaRelationships' });
    if (!data.data) return res.status(404).json({ error: 'Not found' });

    const anime = mapAnime(data.data);
    const included = data.included || [];
    anime.genres = included.filter((i) => i.type === 'categories').map((i) => i.attributes?.title).filter(Boolean);
    anime.relations = included.filter((i) => i.type === 'mediaRelationships').map((i) => ({
      type: i.attributes?.role,
      title: i.attributes?.title,
    }));

    res.json({ data: anime });
  } catch (err) {
    console.error('Kitsu anime detail error:', err.message);
    res.status(500).json({ error: 'Failed to get anime details' });
  }
}

async function getMangaById(req, res) {
  try {
    const { id } = req.params;
    const data = await kitsuRequest(`/manga/${id}`, { include: 'genres,categories' });
    if (!data.data) return res.status(404).json({ error: 'Not found' });

    const manga = mapManga(data.data);
    const included = data.included || [];
    manga.genres = included.filter((i) => i.type === 'categories').map((i) => i.attributes?.title).filter(Boolean);

    res.json({ data: manga });
  } catch (err) {
    console.error('Kitsu manga detail error:', err.message);
    res.status(500).json({ error: 'Failed to get manga details' });
  }
}

module.exports = {
  searchAnime,
  searchManga,
  getTrendingAnime,
  getTrendingManga,
  getAnimeById,
  getMangaById,
};
