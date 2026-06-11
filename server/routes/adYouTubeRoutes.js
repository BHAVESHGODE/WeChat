const express = require('express');
const router = express.Router();
const axios = require('axios');
const { execSync } = require('child_process');

const YT_KEY = process.env.YOUTUBE_API_KEY || '';

const CATEGORIES = [
  { id: '0', label: 'All' },
  { id: '10', label: 'Music' },
  { id: '20', label: 'Gaming' },
  { id: '24', label: 'Entertainment' },
  { id: '25', label: 'News' },
  { id: '17', label: 'Sports' },
  { id: '27', label: 'Education' },
  { id: '28', label: 'Science & Tech' },
  { id: '31', label: 'Anime' },
  { id: '23', label: 'Comedy' },
  { id: '22', label: 'People & Blogs' },
  { id: '26', label: 'Howto & Style' },
  { id: '1', label: 'Film & Animation' },
  { id: '15', label: 'Pets & Animals' },
  { id: '29', label: 'Nonprofits' },
  { id: '42', label: 'Shorts' },
];

const STATIC_TRENDING = [
  { videoId: 'jfKfPfyJRdk', title: 'lofi hip hop radio - beats to relax/study to', artist: 'Lofi Girl', thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg', duration: 0, views: 999999999, source: 'adyoutube' },
  { videoId: '5qap5aO4i9A', title: 'Chillstep Music for Studying', artist: 'Chillstep', thumbnail: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg', duration: 0, views: 50000000, source: 'adyoutube' },
  { videoId: 'lTRiuFIWV54', title: '1 A.M Study Session - lofi hip hop', artist: 'Lofi Girl', thumbnail: 'https://i.ytimg.com/vi/lTRiuFIWV54/hqdefault.jpg', duration: 3674, views: 80000000, source: 'adyoutube' },
  { videoId: 'DWcJFNfaw9c', title: 'Synthwave Radio - 24/7 Retrowave', artist: 'Synthwave', thumbnail: 'https://i.ytimg.com/vi/DWcJFNfaw9c/hqdefault.jpg', duration: 0, views: 30000000, source: 'adyoutube' },
  { videoId: 'hHW1oY26kxQ', title: 'Jazz Hip Hop - Relaxing Music', artist: 'Chillhop Music', thumbnail: 'https://i.ytimg.com/vi/hHW1oY26kxQ/hqdefault.jpg', duration: 0, views: 40000000, source: 'adyoutube' },
  { videoId: 'M5QY2_2j4EM', title: 'Rain Sounds for Sleeping', artist: 'Relaxing Sounds', thumbnail: 'https://i.ytimg.com/vi/M5QY2_2j4EM/hqdefault.jpg', duration: 36000, views: 25000000, source: 'adyoutube' },
  { videoId: 'V4BDhK6Vb5M', title: 'Deep Focus - Music for Concentration', artist: 'Focus Music', thumbnail: 'https://i.ytimg.com/vi/V4BDhK6Vb5M/hqdefault.jpg', duration: 0, views: 20000000, source: 'adyoutube' },
  { videoId: 'qJX8HtPmHmI', title: 'Calm Piano Music 24/7', artist: 'Piano Relaxing', thumbnail: 'https://i.ytimg.com/vi/qJX8HtPmHmI/hqdefault.jpg', duration: 0, views: 35000000, source: 'adyoutube' },
];

function parseDuration(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return (parseInt(m?.[1] || 0) * 3600) + (parseInt(m?.[2] || 0) * 60) + parseInt(m?.[3] || 0);
}

function extractThumb(d) {
  if (d.thumbnail) return d.thumbnail;
  if (d.thumbnails && Array.isArray(d.thumbnails) && d.thumbnails.length > 0) {
    return d.thumbnails[d.thumbnails.length - 1]?.url || d.thumbnails[0]?.url || '';
  }
  return '';
}

function parseYtDlpLine(line) {
  try {
    const d = JSON.parse(line);
    if (d._type === 'playlist') return null;
    return {
      videoId: d.id || '',
      title: d.title || '',
      artist: d.channel || d.uploader || 'Unknown',
      thumbnail: extractThumb(d),
      channelId: d.channel_id || '',
      duration: Math.floor(d.duration || 0),
      views: d.view_count || 0,
      source: 'adyoutube',
    };
  } catch { return null; }
}

function ytDlpSearch(query, limit = 20) {
  try {
    const result = execSync(
      `yt-dlp --no-warnings --dump-json --default-search "ytsearch" --flat-playlist "ytsearch${limit}:${query.replace(/"/g, '\\"')}"`,
      { timeout: 30000, shell: true, maxBuffer: 5 * 1024 * 1024 }
    );
    return result.toString().trim().split('\n').filter(Boolean).map(parseYtDlpLine).filter(Boolean);
  } catch { return null; }
}

function ytDlpTrending(limit = 20) {
  try {
    const result = execSync(
      `yt-dlp --no-warnings --dump-json --default-search "ytsearch" --flat-playlist "ytsearch${limit}:trending music"`,
      { timeout: 30000, shell: true, maxBuffer: 5 * 1024 * 1024 }
    );
    const tracks = result.toString().trim().split('\n').filter(Boolean).map(parseYtDlpLine).filter(Boolean);
    if (tracks.length > 0) return tracks;
  } catch {}

  try {
    const result = execSync(
      `yt-dlp --no-warnings --dump-json --flat-playlist --playlist-end ${limit} "https://www.youtube.com/watch?v=JGwWNGJdvx8&list=PL4fGSI1pDJn6O1LS0XSdAp3bMgup4K1kR"`,
      { timeout: 30000, shell: true, maxBuffer: 5 * 1024 * 1024 }
    );
    return result.toString().trim().split('\n').filter(Boolean).map(parseYtDlpLine).filter(Boolean);
  } catch { return null; }
}

router.get('/search', async (req, res) => {
  const { q, limit = 20, category } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });

  if (YT_KEY) {
    try {
      const searchParams = { part: 'snippet', q, type: 'video', maxResults: limit, key: YT_KEY };
      if (category && category !== '0') searchParams.videoCategoryId = category;
      const { data } = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: searchParams, timeout: 8000,
      });
      const videoIds = (data.items || []).map((i) => i.id.videoId).filter(Boolean).join(',');
      let statsMap = {};
      if (videoIds) {
        try {
          const { data: statsData } = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: { part: 'contentDetails,statistics', id: videoIds, key: YT_KEY },
            timeout: 5000,
          });
          for (const item of statsData.items || []) {
            statsMap[item.id] = { duration: parseDuration(item.contentDetails?.duration), views: parseInt(item.statistics?.viewCount || 0), likes: parseInt(item.statistics?.likeCount || 0) };
          }
        } catch {}
      }
      const tracks = (data.items || []).map((t) => ({
        videoId: t.id.videoId, title: t.snippet.title, artist: t.snippet.channelTitle,
        thumbnail: t.snippet.thumbnails?.high?.url || t.snippet.thumbnails?.default?.url || '',
        channelId: t.snippet.channelId, publishedAt: t.snippet.publishedAt,
        duration: statsMap[t.id.videoId]?.duration || 0, views: statsMap[t.id.videoId]?.views || 0, likes: statsMap[t.id.videoId]?.likes || 0,
        source: 'adyoutube',
      }));
      return res.json({ tracks });
    } catch (err) {
      console.error('YouTube API search failed, falling back to yt-dlp:', err.message);
    }
  }

  const tracks = ytDlpSearch(q, Math.min(limit, 20));
  if (tracks) return res.json({ tracks, source: 'yt-dlp' });
  res.status(502).json({ error: 'Search failed - no API key and yt-dlp not available' });
});

router.get('/trending', async (req, res) => {
  const { limit = 20, category, region } = req.query;

  if (YT_KEY) {
    try {
      const trendingParams = { part: 'snippet,contentDetails,statistics', chart: 'mostPopular', regionCode: region || 'IN', maxResults: limit, key: YT_KEY };
      if (category && category !== '0') trendingParams.videoCategoryId = category;
      const { data } = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: trendingParams, timeout: 8000,
      });
      const tracks = (data.items || []).map((t) => ({
        videoId: t.id, title: t.snippet.title, artist: t.snippet.channelTitle,
        thumbnail: t.snippet.thumbnails?.high?.url || t.snippet.thumbnails?.default?.url || '',
        channelId: t.snippet.channelId, publishedAt: t.snippet.publishedAt,
        duration: parseDuration(t.contentDetails?.duration), views: parseInt(t.statistics?.viewCount || 0), likes: parseInt(t.statistics?.likeCount || 0),
        source: 'adyoutube',
      }));
      return res.json({ tracks, regionCode: 'IN' });
    } catch (err) {
      console.error('YouTube API trending failed, falling back to yt-dlp:', err.message);
    }
  }

  const tracks = ytDlpTrending(Math.min(limit, 8));
  if (tracks) return res.json({ tracks, source: 'yt-dlp' });
  res.json({ tracks: STATIC_TRENDING, source: 'static' });
});

router.get('/stream', async (req, res) => {
  const { videoId, format } = req.query;
  if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
  const fmt = format || 'bestaudio[ext=m4a]/bestaudio/best';
  try {
    const result = execSync(
      `yt-dlp --no-warnings --get-url --format "${fmt.replace(/"/g, '\\"')}" "https://www.youtube.com/watch?v=${videoId}"`,
      { timeout: 30000, shell: true }
    );
    const url = result.toString().trim().split('\n')[0];
    if (!url) return res.status(502).json({ error: 'Could not extract stream URL' });
    res.json({ streamUrl: url, videoId });
  } catch (err) {
    res.status(502).json({ error: 'Stream extraction failed', detail: err.message });
  }
});

router.get('/info', async (req, res) => {
  const { videoId } = req.query;
  if (!videoId) return res.status(400).json({ error: 'Missing videoId' });

  if (YT_KEY) {
    try {
      const { data } = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: { part: 'snippet,contentDetails,statistics', id: videoId, key: YT_KEY }, timeout: 8000,
      });
      const t = data.items?.[0];
      if (!t) return res.status(404).json({ error: 'Video not found' });
      return res.json({
        videoId: t.id, title: t.snippet.title, artist: t.snippet.channelTitle,
        thumbnail: t.snippet.thumbnails?.maxres?.url || t.snippet.thumbnails?.high?.url || '',
        channelId: t.snippet.channelId, publishedAt: t.snippet.publishedAt,
        description: t.snippet.description, duration: parseDuration(t.contentDetails?.duration),
        views: parseInt(t.statistics?.viewCount || 0), likes: parseInt(t.statistics?.likeCount || 0),
        source: 'adyoutube',
      });
    } catch (err) {
      console.error('YouTube API info failed, falling back to yt-dlp:', err.message);
    }
  }

  try {
    const result = execSync(
      `yt-dlp --no-warnings --dump-json "https://www.youtube.com/watch?v=${videoId}"`,
      { timeout: 30000, shell: true, maxBuffer: 5 * 1024 * 1024 }
    );
    const d = JSON.parse(result.toString().trim().split('\n')[0]);
    res.json({
      videoId: d.id, title: d.title, artist: d.channel || d.uploader || 'Unknown',
      thumbnail: extractThumb(d), channelId: d.channel_id || '',
      description: (d.description || '').slice(0, 1000), duration: Math.floor(d.duration || 0),
      views: d.view_count || 0, source: 'adyoutube',
    });
  } catch (err) {
    res.status(502).json({ error: 'Video info failed', detail: err.message });
  }
});

router.get('/related', async (req, res) => {
  const { videoId, limit = 12 } = req.query;
  if (!videoId) return res.status(400).json({ error: 'Missing videoId' });

  if (YT_KEY) {
    try {
      const { data } = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: { part: 'snippet', relatedToVideoId: videoId, type: 'video', maxResults: limit, key: YT_KEY },
        timeout: 8000,
      });
      const tracks = (data.items || []).map((t) => ({
        videoId: t.id.videoId, title: t.snippet.title, artist: t.snippet.channelTitle,
        thumbnail: t.snippet.thumbnails?.high?.url || t.snippet.thumbnails?.default?.url || '',
        source: 'adyoutube',
      }));
      return res.json({ tracks });
    } catch (err) {
      console.error('YouTube API related failed, falling back to yt-dlp:', err.message);
    }
  }

  try {
    const info = execSync(
      `yt-dlp --no-warnings --dump-json "https://www.youtube.com/watch?v=${videoId}"`,
      { timeout: 15000, shell: true, maxBuffer: 5 * 1024 * 1024 }
    );
    const vid = JSON.parse(info.toString().trim().split('\n')[0]);
    const searchTerms = [vid.title, vid.channel || vid.uploader].filter(Boolean).join(' ');
    const result = execSync(
      `yt-dlp --no-warnings --dump-json --default-search "ytsearch" --flat-playlist "ytsearch${Math.min(limit, 12)}:${searchTerms.replace(/"/g, '\\"')}"`,
      { timeout: 30000, shell: true, maxBuffer: 5 * 1024 * 1024 }
    );
    const tracks = result.toString().trim().split('\n').filter(Boolean).map((line) => {
      const d = JSON.parse(line);
      if (!d.id || d.id === videoId) return null;
      return { videoId: d.id, title: d.title || '', artist: d.channel || d.uploader || 'Unknown', thumbnail: extractThumb(d), source: 'adyoutube' };
    }).filter(Boolean);
    res.json({ tracks, source: 'yt-dlp' });
  } catch (err) {
    res.status(502).json({ error: 'Related videos failed', detail: err.message });
  }
});

const YouTubeTrack = require('../models/YouTubeTrack');
const YouTubeDownload = require('../models/YouTubeDownload');
const YouTubeFavorite = require('../models/YouTubeFavorite');

router.get('/favorites', async (req, res) => {
  try {
    const favorites = await YouTubeFavorite.find().sort({ addedAt: -1 }).limit(50);
    res.json({ tracks: favorites });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch favorites', detail: err.message });
  }
});

router.post('/favorites', async (req, res) => {
  try {
    const { videoId, title, artist, thumbnail, duration, views, channelId } = req.body;
    if (!videoId || !title) return res.status(400).json({ error: 'Missing videoId or title' });
    const existing = await YouTubeFavorite.findOne({ videoId });
    if (existing) return res.json({ track: existing, message: 'Already in favorites' });
    const track = await YouTubeFavorite.create({ videoId, title, artist, thumbnail, duration, views, channelId });
    res.json({ track, message: 'Added to favorites' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save favorite', detail: err.message });
  }
});

router.delete('/favorites/:videoId', async (req, res) => {
  try {
    await YouTubeFavorite.findOneAndDelete({ videoId: req.params.videoId });
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove favorite', detail: err.message });
  }
});

router.post('/cache', async (req, res) => {
  try {
    const { videoId, title, artist, thumbnail, duration, format, quality } = req.body;
    if (!videoId || !title) return res.status(400).json({ error: 'Missing videoId or title' });
    const existing = await YouTubeDownload.findOne({ videoId, format, quality });
    if (existing) return res.json({ download: existing, message: 'Already cached' });
    const download = await YouTubeDownload.create({
      videoId, title, artist, thumbnail, duration, format: format || 'audio',
      quality: quality || 'medium',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    try {
      const fmt = format === 'video' ? 'best[height<=720]' : 'bestaudio[ext=m4a]/bestaudio';
      const result = execSync(
        `yt-dlp --no-warnings --get-url --format "${fmt}" "https://www.youtube.com/watch?v=${videoId}"`,
        { timeout: 30000, shell: true }
      );
      const streamUrl = result.toString().trim().split('\n')[0];
      download.filePath = streamUrl;
      await download.save();
    } catch {}
    res.json({ download, message: 'Cached for offline use' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cache', detail: err.message });
  }
});

router.get('/cached', async (req, res) => {
  try {
    const downloads = await YouTubeDownload.find().sort({ downloadedAt: -1 }).limit(50);
    res.json({ downloads });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cached items', detail: err.message });
  }
});

router.get('/recommendations', async (req, res) => {
  const { videoId, limit = 12 } = req.query;
  try {
    if (videoId) {
      try {
        const { data } = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: { part: 'snippet', relatedToVideoId: videoId, type: 'video', maxResults: limit, key: YT_KEY },
          timeout: 8000,
        });
        const tracks = (data.items || []).map((t) => ({
          videoId: t.id.videoId, title: t.snippet.title, artist: t.snippet.channelTitle,
          thumbnail: t.snippet.thumbnails?.high?.url || t.snippet.thumbnails?.default?.url || '',
          source: 'adyoutube',
        }));
        if (tracks.length > 0) return res.json({ tracks, source: 'youtube-api' });
      } catch {}
    }
    const popular = await YouTubeFavorite.find().sort({ addedAt: -1 }).limit(limit);
    if (popular.length > 0) {
      const tracks = popular.map((t) => ({
        videoId: t.videoId, title: t.title, artist: t.artist,
        thumbnail: t.thumbnail, duration: t.duration, views: t.views,
        source: 'adyoutube',
      }));
      return res.json({ tracks, source: 'favorites' });
    }
    try {
      const { data } = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: { part: 'snippet,statistics', chart: 'mostPopular', regionCode: 'IN', maxResults: Math.min(limit, 20), key: YT_KEY },
        timeout: 8000,
      });
      const tracks = (data.items || []).map((t) => ({
        videoId: t.id, title: t.snippet.title, artist: t.snippet.channelTitle,
        thumbnail: t.snippet.thumbnails?.high?.url || '',
        views: parseInt(t.statistics?.viewCount || 0), source: 'adyoutube',
      }));
      if (tracks.length > 0) return res.json({ tracks, source: 'trending' });
    } catch {}
    res.json({ tracks: STATIC_TRENDING.slice(0, limit), source: 'static' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recommendations', detail: err.message });
  }
});

router.get('/proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });
  try {
    const response = await axios({
      method: 'GET',
      url: decodeURIComponent(url),
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.youtube.com/',
      },
    });
    res.set(response.headers);
    response.data.pipe(res);
  } catch (err) {
    res.status(502).json({ error: 'Proxy failed', detail: err.message });
  }
});

router.get('/stream/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Missing video id' });
  try {
    const result = execSync(
      `yt-dlp --no-warnings --get-url --format "bestaudio[ext=m4a]/bestaudio/best" "https://www.youtube.com/watch?v=${id}"`,
      { timeout: 30000, shell: true }
    );
    const url = result.toString().trim().split('\n')[0];
    if (!url) return res.status(502).json({ error: 'Could not extract stream URL' });
    res.json({ streamUrl: url, videoId: id });
  } catch (err) {
    res.status(502).json({ error: 'Stream extraction failed', detail: err.message });
  }
});

router.post('/lyrics', async (req, res) => {
  const { title, artist } = req.body;
  if (!title) return res.status(400).json({ error: 'Missing title' });
  try {
    const { data } = await axios.get('https://api.lyrics.ovh/v1/' + encodeURIComponent(artist || '') + '/' + encodeURIComponent(title), { timeout: 5000 });
    if (data.lyrics) return res.json({ lyrics: data.lyrics });
  } catch {}
  try {
    const q = encodeURIComponent(`${title} ${artist || ''} lyrics`);
    const { data } = await axios.get(`https://api.verone.su/search?q=${q}`, { timeout: 5000 });
    if (data?.result?.[0]?.lyrics) return res.json({ lyrics: data.result[0].lyrics });
  } catch {}
  res.json({ lyrics: '' });
});

router.get('/categories', (req, res) => {
  res.json({ categories: CATEGORIES });
});

module.exports = router;