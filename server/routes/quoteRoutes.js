const express = require('express');
const router = express.Router();
const axios = require('axios');
const Quote = require('../models/Quote');

const CACHE_TTL = 3600000;

async function fetchAnimeChanRandom() {
  try {
    const { data } = await axios.get('https://animechan.xyz/api/random', { timeout: 5000 });
    if (data && data.quote) return { quote: data.quote, character: data.character, anime: data.anime };
  } catch {}
  return null;
}

async function fetchAnimeChanByAnime(anime) {
  try {
    const { data } = await axios.get(`https://animechan.xyz/api/random/anime?title=${encodeURIComponent(anime)}`, { timeout: 5000 });
    if (data && data.quote) return { quote: data.quote, character: data.character, anime: data.anime };
  } catch {}
  return null;
}

async function fetchAnimeChanByCharacter(character) {
  try {
    const { data } = await axios.get(`https://animechan.xyz/api/random/character?name=${encodeURIComponent(character)}`, { timeout: 5000 });
    if (data && data.quote) return { quote: data.quote, character: data.character, anime: data.anime };
  } catch {}
  return null;
}

async function fetchAnimeChanQuotes(anime, page = 1) {
  try {
    const { data } = await axios.get(`https://animechan.xyz/api/quotes/anime?title=${encodeURIComponent(anime)}&page=${page}`, { timeout: 8000 });
    if (Array.isArray(data)) return data.map((q) => ({ quote: q.quote, character: q.character, anime: q.anime }));
  } catch {}
  return null;
}

router.get('/random', async (req, res) => {
  try {
    const chan = await fetchAnimeChanRandom();
    if (chan) {
      await Quote.findOneAndUpdate({ quote: chan.quote }, { ...chan, cachedAt: new Date() }, { upsert: true });
      return res.json({ ...chan, source: 'animechan' });
    }
    const dbQuote = await Quote.aggregate([{ $sample: { size: 1 } }]);
    if (dbQuote.length > 0) return res.json({ quote: dbQuote[0].quote, character: dbQuote[0].character, anime: dbQuote[0].anime, source: 'database' });
    res.json({ quote: 'The secret of getting ahead is getting started.', character: 'Mark Twain', anime: '', source: 'fallback' });
  } catch { res.status(500).json({ error: 'Failed to fetch quote' }); }
});

router.get('/multiple', async (req, res) => {
  const { count = 5 } = req.query;
  const results = [];
  for (let i = 0; i < Math.min(parseInt(count), 10); i++) {
    const chan = await fetchAnimeChanRandom();
    if (chan) results.push(chan);
    if (results.length >= count) break;
  }
  if (results.length > 0) return res.json({ quotes: results, source: 'animechan' });
  const dbQuotes = await Quote.aggregate([{ $sample: { size: parseInt(count) } }]);
  res.json({ quotes: dbQuotes || [], source: dbQuotes.length > 0 ? 'database' : 'fallback' });
});

router.get('/anime', async (req, res) => {
  const { title } = req.query;
  if (!title) return res.status(400).json({ error: 'Missing anime title' });
  const quotes = await fetchAnimeChanQuotes(title);
  if (quotes && quotes.length > 0) return res.json({ quotes, source: 'animechan' });
  const dbQuotes = await Quote.find({ anime: { $regex: title, $options: 'i' } }).limit(10);
  if (dbQuotes.length > 0) return res.json({ quotes: dbQuotes, source: 'database' });
  const single = await fetchAnimeChanByAnime(title);
  if (single) return res.json({ quotes: [single], source: 'animechan' });
  res.json({ quotes: [], source: 'none' });
});

router.get('/character', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Missing character name' });
  const chan = await fetchAnimeChanByCharacter(name);
  if (chan) return res.json({ quotes: [chan], source: 'animechan' });
  const dbQuotes = await Quote.find({ character: { $regex: name, $options: 'i' } }).limit(5);
  res.json({ quotes: dbQuotes.length > 0 ? dbQuotes : [{ quote: '', character: name, anime: '' }], source: dbQuotes.length > 0 ? 'database' : 'none' });
});

router.post('/', async (req, res) => {
  try {
    const { quote, character, anime } = req.body;
    if (!quote) return res.status(400).json({ error: 'Missing quote text' });
    const q = await Quote.create({ quote, character: character || '', anime: anime || '' });
    res.json({ data: q, message: 'Quote saved' });
  } catch (err) { res.status(500).json({ error: 'Failed to save quote' }); }
});

module.exports = router;
