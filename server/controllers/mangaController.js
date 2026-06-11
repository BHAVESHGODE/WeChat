const axios = require('axios');
const Manga = require('../models/Manga');

const JIKAN_BASE = 'https://api.jikan.moe/v4';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const searchManga = async (req, res) => {
  try {
    const { q, page, limit, type, status, genres, orderBy, sort } = req.query;
    const params = { q: q || '', page: page || 1, limit: limit || 25 };
    if (type) params.type = type;
    if (status) params.status = status;
    if (genres) params.genres = genres;
    if (orderBy) params.order_by = orderBy;
    if (sort) params.sort = sort;

    const { data } = await axios.get(`${JIKAN_BASE}/manga`, { params });
    res.json(data);
  } catch (error) {
    if (error.response?.status === 429) {
      await delay(1000);
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/manga`, { params: req.query });
        return res.json(data);
      } catch (retryError) {
        return res.status(429).json({ error: 'Rate limited. Please try again.' });
      }
    }
    res.status(500).json({ error: error.message });
  }
};

const getTopManga = async (req, res) => {
  try {
    const { page, limit, type, filter } = req.query;
    const params = { page: page || 1, limit: limit || 25 };
    if (type) params.type = type;
    if (filter) params.filter = filter;

    const { data } = await axios.get(`${JIKAN_BASE}/top/manga`, { params });
    res.json(data);
  } catch (error) {
    if (error.response?.status === 429) {
      await delay(1000);
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/top/manga`, { params: req.query });
        return res.json(data);
      } catch (retryError) {
        return res.status(429).json({ error: 'Rate limited. Please try again.' });
      }
    }
    res.status(500).json({ error: error.message });
  }
};

const getMangaById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await axios.get(`${JIKAN_BASE}/manga/${id}/full`);
    res.json(data);
  } catch (error) {
    if (error.response?.status === 429) {
      await delay(1000);
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/manga/${req.params.id}/full`);
        return res.json(data);
      } catch (retryError) {
        return res.status(429).json({ error: 'Rate limited. Please try again.' });
      }
    }
    res.status(500).json({ error: error.message });
  }
};

const getMangaCharacters = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await axios.get(`${JIKAN_BASE}/manga/${id}/characters`);
    res.json(data);
  } catch (error) {
    if (error.response?.status === 429) {
      await delay(1000);
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/manga/${req.params.id}/characters`);
        return res.json(data);
      } catch (retryError) {
        return res.status(429).json({ error: 'Rate limited.' });
      }
    }
    res.status(500).json({ error: error.message });
  }
};

const getMangaRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await axios.get(`${JIKAN_BASE}/manga/${id}/recommendations`);
    res.json(data);
  } catch (error) {
    if (error.response?.status === 429) {
      await delay(1000);
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/manga/${req.params.id}/recommendations`);
        return res.json(data);
      } catch (retryError) {
        return res.status(429).json({ error: 'Rate limited.' });
      }
    }
    res.status(500).json({ error: error.message });
  }
};

const getMangaGenres = async (req, res) => {
  try {
    const { data } = await axios.get(`${JIKAN_BASE}/genres/manga`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  searchManga,
  getTopManga,
  getMangaById,
  getMangaCharacters,
  getMangaRecommendations,
  getMangaGenres,
};
