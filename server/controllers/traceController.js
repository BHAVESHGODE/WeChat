const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const TRACE_BASE = 'https://api.trace.moe';

const searchByImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);

    const form = new FormData();
    form.append('image', imageBuffer, {
      filename: req.file.originalname || 'screenshot.png',
      contentType: req.file.mimetype,
    });

    const { data } = await axios.post(`${TRACE_BASE}/search`, form, {
      headers: {
        ...form.getHeaders(),
      },
      params: { cutBorders: true },
    });

    fs.unlink(imagePath, () => {});

    const results = (data.result || []).slice(0, 5).map((r) => ({
      anime: r.filename || r.anilist?.title?.romaji || 'Unknown',
      titleEnglish: r.anilist?.title?.english || '',
      titleNative: r.anilist?.title?.native || '',
      episode: r.episode,
      from: r.from,
      to: r.to,
      similarity: r.similarity,
      video: r.video,
      image: r.image,
      anilistId: r.anilist?.id,
      malId: r.anilist?.idMal,
    }));

    res.json({ results });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ error: error.message });
  }
};

const searchByUrl = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'No image URL provided' });
    }

    const { data } = await axios.post(`${TRACE_BASE}/search`, null, {
      params: { url, cutBorders: true },
    });

    const results = (data.result || []).slice(0, 5).map((r) => ({
      anime: r.filename || r.anilist?.title?.romaji || 'Unknown',
      titleEnglish: r.anilist?.title?.english || '',
      titleNative: r.anilist?.title?.native || '',
      episode: r.episode,
      from: r.from,
      to: r.to,
      similarity: r.similarity,
      video: r.video,
      image: r.image,
      anilistId: r.anilist?.id,
      malId: r.anilist?.idMal,
    }));

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { searchByImage, searchByUrl };
