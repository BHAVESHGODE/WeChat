const axios = require('axios');

const ASURA = 'https://asuratoon.com';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractMangaList(html) {
  const regex = /<div\s+class=["']?bs["']?[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  const items = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const block = match[1];
    const titleMatch = block.match(/alt=["']([^"']+)["']/);
    const linkMatch = block.match(/href=["']([^"']+?)["']/);
    const imgMatch = block.match(/src=["']([^"']+?)["']/);
    const chapterMatch = block.match(/chapter.*?(\d+(?:\.\d+)?)/i);
    const ratingMatch = block.match(/rating.*?(\d+(?:\.\d+)?)/i);
    if (titleMatch || linkMatch) {
      items.push({
        title: titleMatch ? titleMatch[1].trim() : 'Unknown',
        url: linkMatch ? linkMatch[1] : '',
        imageUrl: imgMatch ? imgMatch[1] : null,
        latestChapter: chapterMatch ? parseFloat(chapterMatch[1]) : null,
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
        source: 'asurascans',
      });
    }
  }
  return items;
}

function extractChapters(html) {
  const regex = /<li[^>]*class=["']?wp-manga-chapter["']?[^>]*>([\s\S]*?)<\/li>/gi;
  const chapters = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const block = match[1];
    const linkMatch = block.match(/href=["']([^"']+?)["']/);
    const titleMatch = block.match(/>(?:Chapter|Ch\.?)?\s*(\d+(?:\.\d+)?)\s*[<:]/i);
    const dateMatch = block.match(/(\d{4}-\d{2}-\d{2})/);
    const nameMatch = block.match(/<a[^>]*>([^<]+)<\/a>/);
    if (linkMatch) {
      chapters.push({
        url: linkMatch[1],
        chapter: titleMatch ? parseFloat(titleMatch[1]) : null,
        title: nameMatch ? nameMatch[1].trim() : '',
        date: dateMatch ? dateMatch[1] : null,
      });
    }
  }
  return chapters.reverse();
}

function extractChapterPages(html) {
  const regex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  const pages = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const src = match[1];
    if (src.includes('.jpg') || src.includes('.png') || src.includes('.webp') || src.includes('.jpeg')) {
      pages.push({ url: src });
    }
  }
  return pages;
}

async function fetchAsura(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://asuratoon.com/',
      },
      timeout: 15000,
    });
    return data;
  } catch (err) {
    throw err;
  }
}

async function searchManga(req, res) {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query is required' });

    const data = await fetchAsura(`${ASURA}/page/${page}/?s=${encodeURIComponent(q)}`);
    const mangaList = extractMangaList(data);

    const totalMatch = data.match(/page\/(\d+)\//g);
    const totalPages = totalMatch ? Math.max(...totalMatch.map((m) => parseInt(m.match(/\d+/)[0]))) : 1;

    res.json({ data: mangaList.slice(0, limit), total: mangaList.length, page: parseInt(page), totalPages });
  } catch (err) {
    console.error('AsuraScans search error:', err.message);
    res.status(500).json({ error: 'Failed to search AsuraScans' });
  }
}

async function getMangaList(req, res) {
  try {
    const { page = 1, status, genre } = req.query;
    let url = `${ASURA}/manga/page/${page}/`;
    if (status) url += `?status=${status}`;
    if (genre) url += `${url.includes('?') ? '&' : '?'}genre=${genre}`;

    const data = await fetchAsura(url);
    const mangaList = extractMangaList(data);
    res.json({ data: mangaList, page: parseInt(page) });
  } catch (err) {
    console.error('AsuraScans list error:', err.message);
    res.status(500).json({ error: 'Failed to get manga list' });
  }
}

async function getMangaDetail(req, res) {
  try {
    const { id } = req.params;
    const url = `${ASURA}/manga/${id}/`;
    const data = await fetchAsura(url);

    const titleMatch = data.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const descMatch = data.match(/<div\s+class=["']?description["']?[^>]*>([\s\S]*?)<\/div>/i);
    const imgMatch = data.match(/<img[^>]*class=["']?wp-manga-cover["']?[^>]*src=["']([^"']+)["']/i);
    const authorMatch = data.match(/Author[^:]*:\s*([^<]+)/i);
    const statusMatch = data.match(/Status[^:]*:\s*([^<]+)/i);
    const genreMatch = data.match(/Genre[^:]*:\s*([^<]+)/i);

    const desc = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    const genres = genreMatch ? genreMatch[1].split(',').map((g) => g.trim()) : [];
    const chapters = extractChapters(data);

    res.json({
      data: {
        title: titleMatch ? titleMatch[1].trim() : 'Unknown',
        description: desc,
        imageUrl: imgMatch ? imgMatch[1] : null,
        author: authorMatch ? authorMatch[1].trim() : 'Unknown',
        status: statusMatch ? statusMatch[1].trim() : 'Ongoing',
        genres,
        chapters,
        url: `${ASURA}/manga/${id}/`,
        source: 'asurascans',
      },
    });
  } catch (err) {
    console.error('AsuraScans detail error:', err.message);
    res.status(500).json({ error: 'Failed to get manga details' });
  }
}

async function getChapterPages(req, res) {
  try {
    const { id, chapter } = req.params;
    const chapterUrl = decodeURIComponent(`${ASURA}/manga/${id}/${chapter}/`);
    const data = await fetchAsura(chapterUrl);
    const pages = extractChapterPages(data);

    const chapterInfo = {
      current: parseFloat(chapter),
      prev: null,
      next: null,
    };

    const navMatch = data.match(/<a[^>]*class=["']?prev["']?[^>]*href=["']([^"']+)["']/i);
    const nextMatch = data.match(/<a[^>]*class=["']?next["']?[^>]*href=["']([^"']+)["']/i);
    if (navMatch && navMatch[1] !== '#') chapterInfo.prev = navMatch[1];
    if (nextMatch && nextMatch[1] !== '#') chapterInfo.next = nextMatch[1];

    res.json({ data: { pages, chapterInfo } });
  } catch (err) {
    console.error('AsuraScans chapter error:', err.message);
    res.status(500).json({ error: 'Failed to get chapter pages' });
  }
}

module.exports = {
  searchManga,
  getMangaList,
  getMangaDetail,
  getChapterPages,
};
