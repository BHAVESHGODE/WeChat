const axios = require('axios');
const Anime = require('../models/Anime');
const Favorite = require('../models/Favorite');

const JIKAN_BASE = 'https://api.jikan.moe/v4';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const searchAnime = async (req, res) => {
  try {
    const { q, page, limit, type, status, rating, genres, orderBy, sort, season, year } = req.query;
    const params = { q: q || '', page: page || 1, limit: limit || 25 };
    if (type) params.type = type;
    if (status) params.status = status;
    if (rating) params.rating = rating;
    if (genres) params.genres = genres;
    if (orderBy) params.order_by = orderBy;
    if (sort) params.sort = sort;
    if (season) params.season = season;
    if (year) params.year = year;

    const { data } = await axios.get(`${JIKAN_BASE}/anime`, { params });
    res.json(data);
  } catch (error) {
    if (error.response?.status === 429) {
      await delay(1000);
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/anime`, { params: req.query });
        return res.json(data);
      } catch (retryError) {
        return res.status(429).json({ error: 'Rate limited. Please try again.', retryAfter: 1 });
      }
    }
    res.status(500).json({ error: error.message });
  }
};

const getTopAnime = async (req, res) => {
  try {
    const { page, limit, type, filter } = req.query;
    const params = { page: page || 1, limit: limit || 25 };
    if (type) params.type = type;
    if (filter) params.filter = filter;

    const { data } = await axios.get(`${JIKAN_BASE}/top/anime`, { params });
    res.json(data);
  } catch (error) {
    if (error.response?.status === 429) {
      await delay(1000);
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/top/anime`, { params: req.query });
        return res.json(data);
      } catch (retryError) {
        return res.status(429).json({ error: 'Rate limited. Please try again.' });
      }
    }
    res.status(500).json({ error: error.message });
  }
};

const getAnimeById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await axios.get(`${JIKAN_BASE}/anime/${id}/full`);
    res.json(data);
  } catch (error) {
    if (error.response?.status === 429) {
      await delay(1000);
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/anime/${req.params.id}/full`);
        return res.json(data);
      } catch (retryError) {
        return res.status(429).json({ error: 'Rate limited. Please try again.' });
      }
    }
    res.status(500).json({ error: error.message });
  }
};

const getAnimeCharacters = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await axios.get(`${JIKAN_BASE}/anime/${id}/characters`);
    res.json(data);
  } catch (error) {
    if (error.response?.status === 429) {
      await delay(1000);
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/anime/${req.params.id}/characters`);
        return res.json(data);
      } catch (retryError) {
        return res.status(429).json({ error: 'Rate limited.' });
      }
    }
    res.status(500).json({ error: error.message });
  }
};

const getAnimeReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page } = req.query;
    const { data } = await axios.get(`${JIKAN_BASE}/anime/${id}/reviews`, { params: { page: page || 1 } });
    res.json(data);
  } catch (error) {
    if (error.response?.status === 429) {
      await delay(1000);
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/anime/${req.params.id}/reviews`, { params: req.query });
        return res.json(data);
      } catch (retryError) {
        return res.status(429).json({ error: 'Rate limited.' });
      }
    }
    res.status(500).json({ error: error.message });
  }
};

const getAnimeRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await axios.get(`${JIKAN_BASE}/anime/${id}/recommendations`);
    res.json(data);
  } catch (error) {
    if (error.response?.status === 429) {
      await delay(1000);
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/anime/${req.params.id}/recommendations`);
        return res.json(data);
      } catch (retryError) {
        return res.status(429).json({ error: 'Rate limited.' });
      }
    }
    res.status(500).json({ error: error.message });
  }
};

const getSeasonalAnime = async (req, res) => {
  try {
    const { year, season, page, limit } = req.query;
    const y = year || new Date().getFullYear();
    const s = season || (() => {
      const m = new Date().getMonth() + 1;
      if (m >= 1 && m <= 3) return 'winter';
      if (m >= 4 && m <= 6) return 'spring';
      if (m >= 7 && m <= 9) return 'summer';
      return 'fall';
    })();
    const { data } = await axios.get(`${JIKAN_BASE}/seasons/${y}/${s}`, {
      params: { page: page || 1, limit: limit || 25 }
    });
    res.json(data);
  } catch (error) {
    if (error.response?.status === 429) {
      await delay(1000);
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/seasons/${req.query.year || new Date().getFullYear()}/${req.query.season || 'spring'}`, { params: req.query });
        return res.json(data);
      } catch (retryError) {
        return res.status(429).json({ error: 'Rate limited.' });
      }
    }
    res.status(500).json({ error: error.message });
  }
};

const getAnimeSchedules = async (req, res) => {
  try {
    const { day, page, limit } = req.query;
    const params = { page: page || 1, limit: limit || 25 };
    if (day) params.day = day;
    const { data } = await axios.get(`${JIKAN_BASE}/schedules`, { params });
    res.json(data);
  } catch (error) {
    if (error.response?.status === 429) {
      await delay(1000);
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/schedules`, { params: req.query });
        return res.json(data);
      } catch (retryError) {
        return res.status(429).json({ error: 'Rate limited.' });
      }
    }
    res.status(500).json({ error: error.message });
  }
};

const getAnimeGenres = async (req, res) => {
  try {
    const { data } = await axios.get(`${JIKAN_BASE}/genres/anime`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  searchAnime,
  getTopAnime,
  getAnimeById,
  getAnimeCharacters,
  getAnimeReviews,
  getAnimeRecommendations,
  getSeasonalAnime,
  getAnimeSchedules,
  getAnimeGenres,
};
