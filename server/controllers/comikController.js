const axios = require('axios');

const BASE = 'https://comick.io';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function headers(ref = BASE + '/') {
  return { 'User-Agent': UA, 'Referer': ref, 'Accept': 'text/html,application/json,*/*' };
}

function extractSearch(html) {
  const items = [];
  const regex = /<a[^>]*href="\/comic\/([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<div[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    items.push({ slug: m[1], imageUrl: m[2], title: m[3].replace(/<[^>]*>/g, '').trim(), source: 'comik' });
  }
  return items;
}

function extractDetail(html) {
  const title = (html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || [])[1]?.trim() || 'Unknown';
  const desc = (html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i) || [])[1]?.replace(/<[^>]*>/g, '').trim() || '';
  const img = (html.match(/<img[^>]*class="[^"]*cover[^"]*"[^>]*src="([^"]+)"/i) || [])[1] || '';
  const author = (html.match(/author[^:]*:\s*([^<]+)/i) || [])[1]?.trim() || 'Unknown';
  const status = (html.match(/status[^:]*:\s*([^<]+)/i) || [])[1]?.trim() || 'Ongoing';
  const year = (html.match(/year[^:]*:\s*(\d{4})/i) || [])[1] || null;
  const genres = [];
  const gRegex = /<a[^>]*href="\/genre\/[^"]+"[^>]*>([^<]+)<\/a>/gi;
  let g;
  while ((g = gRegex.exec(html)) !== null) genres.push(g[1].trim());
  return { title, description: desc, imageUrl: img, author, status, year, genres, source: 'comik' };
}

function extractChapters(html) {
  const chapters = [];
  const regex = /<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?chapter[^\d]*(\d+(?:\.\d+)?)/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    chapters.push({ url: m[1], chapter: parseFloat(m[2]) });
  }
  return chapters.reverse();
}

function extractChapterPages(html) {
  const pages = [];
  const regex = /<img[^>]*src="([^"]+\.(?:jpg|png|webp))"[^>]*>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) pages.push({ url: m[1] });
  return pages;
}

async function searchManga(req, res) {
  try {
    const { q, page = 1 } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    const { data } = await axios.get(`${BASE}/search?q=${encodeURIComponent(q)}&page=${page}`, { headers: headers(), timeout: 15000 });
    const mangaList = extractSearch(data);
    res.json({ data: mangaList, page: parseInt(page), source: 'comik' });
  } catch (err) {
    res.status(500).json({ error: 'ComiK search failed', detail: err.message });
  }
}

async function getMangaDetail(req, res) {
  try {
    const { slug } = req.params;
    const { data } = await axios.get(`${BASE}/comic/${slug}`, { headers: headers(), timeout: 15000 });
    const detail = extractDetail(data);
    const chapters = extractChapters(data);
    res.json({ data: { ...detail, slug, chapters, url: `${BASE}/comic/${slug}` } });
  } catch (err) {
    res.status(500).json({ error: 'ComiK detail failed', detail: err.message });
  }
}

async function getChapterPages(req, res) {
  try {
    const { slug, chapterId } = req.params;
    const url = `${BASE}/comic/${slug}/${chapterId}`;
    const { data } = await axios.get(url, { headers: headers(), timeout: 15000 });
    const pages = extractChapterPages(data);
    res.json({ data: { pages, chapterUrl: url } });
  } catch (err) {
    res.status(500).json({ error: 'ComiK chapter failed', detail: err.message });
  }
}

module.exports = { searchManga, getMangaDetail, getChapterPages };
