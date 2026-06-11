const axios = require('axios');

const BASE = 'https://comix.to';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function headers(ref = BASE + '/') {
  return { 'User-Agent': UA, 'Referer': ref, 'Accept': 'text/html,application/json,*/*' };
}

function extractMangaList(html) {
  const items = [];
  const regex = /<div[^>]*class="[^"]*item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const block = m[1];
    const title = (block.match(/alt="([^"]+)"/) || [])[1];
    const img = (block.match(/src="([^"]+)"/) || [])[1];
    const link = (block.match(/href="([^"]+)"/) || [])[1];
    const chapter = (block.match(/chapter[^\d]*(\d+(?:\.\d+)?)/i) || [])[1];
    if (title) items.push({ title: title.trim(), imageUrl: img || null, url: link || '', latestChapter: chapter ? parseFloat(chapter) : null, source: 'comix' });
  }
  return items;
}

function extractDetail(html, id) {
  const title = (html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || [])[1]?.trim() || 'Unknown';
  const desc = (html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i) || [])[1]?.replace(/<[^>]*>/g, '').trim() || '';
  const img = (html.match(/<img[^>]*class="[^"]*cover[^"]*"[^>]*src="([^"]+)"/i) || [])[1] || (html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) || [])[1] || '';
  const author = (html.match(/author[^:]*:\s*([^<]+)/i) || [])[1]?.trim() || 'Unknown';
  const status = (html.match(/status[^:]*:\s*([^<]+)/i) || [])[1]?.trim() || 'Ongoing';
  const year = (html.match(/year[^:]*:\s*(\d{4})/i) || [])[1] || null;
  const genres = [];
  const gRegex = /<a[^>]*href="\/genre\/[^"]+"[^>]*>([^<]+)<\/a>/gi;
  let g;
  while ((g = gRegex.exec(html)) !== null) genres.push(g[1].trim());
  return { title, description: desc, imageUrl: img, author, status, year, genres, source: 'comix' };
}

function extractChapters(html) {
  const chapters = [];
  const regex = /<li[^>]*class="[^"]*wp-manga-chapter[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const block = m[1];
    const link = (block.match(/href="([^"]+)"/) || [])[1];
    const num = (block.match(/chapter[^\d]*(\d+(?:\.\d+)?)/i) || [])[1];
    const date = (block.match(/(\d{4}-\d{2}-\d{2})/) || [])[1];
    const name = (block.match(/<a[^>]*>([^<]+)<\/a>/) || [])[1];
    if (link) chapters.push({ url: link, chapter: num ? parseFloat(num) : null, title: name?.trim() || '', date: date || null });
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
    const { data } = await axios.get(`${BASE}/page/${page}/?s=${encodeURIComponent(q)}`, { headers: headers(), timeout: 15000 });
    const mangaList = extractMangaList(data);
    res.json({ data: mangaList, page: parseInt(page), source: 'comix' });
  } catch (err) {
    res.status(500).json({ error: 'ComiX search failed', detail: err.message });
  }
}

async function getMangaList(req, res) {
  try {
    const { page = 1 } = req.query;
    const { data } = await axios.get(`${BASE}/manga/page/${page}/`, { headers: headers(), timeout: 15000 });
    const mangaList = extractMangaList(data);
    res.json({ data: mangaList, page: parseInt(page), source: 'comix' });
  } catch (err) {
    res.status(500).json({ error: 'ComiX list failed', detail: err.message });
  }
}

async function getMangaDetail(req, res) {
  try {
    const { id } = req.params;
    const { data } = await axios.get(`${BASE}/manga/${id}/`, { headers: headers(), timeout: 15000 });
    const detail = extractDetail(data, id);
    const chapters = extractChapters(data);
    res.json({ data: { ...detail, id, chapters, url: `${BASE}/manga/${id}/` } });
  } catch (err) {
    res.status(500).json({ error: 'ComiX detail failed', detail: err.message });
  }
}

async function getChapterPages(req, res) {
  try {
    const { id, chapter } = req.params;
    const url = decodeURIComponent(`${BASE}/manga/${id}/${chapter}/`);
    const { data } = await axios.get(url, { headers: headers(url), timeout: 15000 });
    const pages = extractChapterPages(data);
    const prev = (data.match(/<a[^>]*class="[^"]*prev[^"]*"[^>]*href="([^"]+)"/i) || [])[1] || null;
    const next = (data.match(/<a[^>]*class="[^"]*next[^"]*"[^>]*href="([^"]+)"/i) || [])[1] || null;
    res.json({ data: { pages, chapterInfo: { chapter: parseFloat(chapter), prev, next } } });
  } catch (err) {
    res.status(500).json({ error: 'ComiX chapter failed', detail: err.message });
  }
}

module.exports = { searchManga, getMangaList, getMangaDetail, getChapterPages };
