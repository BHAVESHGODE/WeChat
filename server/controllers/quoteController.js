const axios = require('axios');
const Quote = require('../models/Quote');

const ANIMECHAN_BASE = 'https://animechan.xyz/api';

const getRandomQuote = async (req, res) => {
  try {
    const { data } = await axios.get(`${ANIMECHAN_BASE}/random`);
    const quote = new Quote({
      quote: data.quote,
      character: data.character,
      anime: data.anime,
    });
    await quote.save().catch(() => {});
    res.json(data);
  } catch (error) {
    const cached = await Quote.aggregate([{ $sample: { size: 1 } }]);
    if (cached.length > 0) {
      return res.json({
        quote: cached[0].quote,
        character: cached[0].character,
        anime: cached[0].anime,
      });
    }
    res.status(500).json({ error: error.message });
  }
};

const getQuotesByAnime = async (req, res) => {
  try {
    const { anime } = req.params;
    const { data } = await axios.get(`${ANIMECHAN_BASE}/anime`, {
      params: { title: anime },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getQuotesByCharacter = async (req, res) => {
  try {
    const { character } = req.params;
    const { data } = await axios.get(`${ANIMECHAN_BASE}/character`, {
      params: { name: character },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMultipleRandomQuotes = async (req, res) => {
  try {
    const { count } = req.query;
    const num = Math.min(parseInt(count) || 5, 20);
    const promises = Array.from({ length: num }, () =>
      axios.get(`${ANIMECHAN_BASE}/random`).then((r) => r.data).catch(() => null)
    );
    const results = (await Promise.all(promises)).filter(Boolean);
    if (results.length === 0) {
      const cached = await Quote.aggregate([{ $sample: { size: num } }]);
      return res.json(cached.map((c) => ({
        quote: c.quote,
        character: c.character,
        anime: c.anime,
      })));
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getRandomQuote,
  getQuotesByAnime,
  getQuotesByCharacter,
  getMultipleRandomQuotes,
};
