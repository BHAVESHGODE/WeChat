const express = require('express');
const router = express.Router();
const axios = require('axios');

const LASTFM_KEY = process.env.LASTFM_API_KEY || '';
const FREESOUND_KEY = process.env.FREESOUND_API_KEY || '';

// ── iTunes Search ──
router.get('/search', async (req, res) => {
  const { q, limit = 15 } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing search query' });
  try {
    const { data } = await axios.get('https://itunes.apple.com/search', {
      params: { term: q, limit, media: 'music', entity: 'song' },
      timeout: 8000,
    });
    const tracks = (data.results || []).map((t) => ({
      title: t.trackName,
      artist: t.artistName,
      album: t.collectionName,
      duration: t.trackTimeMillis ? Math.round(t.trackTimeMillis / 1000) : 0,
      thumbnail: t.artworkUrl100?.replace('100x100', '300x300'),
      previewUrl: t.previewUrl || '',
      genre: t.primaryGenreName || '',
      releaseDate: t.releaseDate ? t.releaseDate.slice(0, 4) : '',
      source: 'itunes',
      trackId: t.trackId,
      artistId: t.artistId,
    }));
    res.json({ tracks, source: 'itunes' });
  } catch (err) {
    res.status(502).json({ error: 'iTunes search failed', detail: err.message });
  }
});

// ── Last.fm Trending / Top Tracks ──
router.get('/trending', async (req, res) => {
  const { country = 'india', limit = 20 } = req.query;
  if (LASTFM_KEY) {
    try {
      const { data } = await axios.get('https://ws.audioscrobbler.com/2.0/', {
        params: {
          method: 'geo.gettoptracks',
          country,
          api_key: LASTFM_KEY,
          format: 'json',
          limit,
        },
        timeout: 8000,
      });
      const tracks = (data.tracks?.track || []).map((t) => ({
        title: t.name,
        artist: t.artist?.name || 'Unknown',
        listeners: parseInt(t.listeners) || 0,
        url: t.url,
        thumbnail: t.image?.find((i) => i.size === 'large')?.['#text'] || '',
        source: 'lastfm',
      }));
      return res.json({ tracks, country });
    } catch (err) {
      console.error('Last.fm trending failed:', err.message);
    }
  }
  try {
    const region = country.toLowerCase() === 'india' ? 'in' : 'us';
    const rssUrl = `https://itunes.apple.com/${region}/rss/topsongs/limit=${Math.min(limit, 50)}/json`;
    const { data } = await axios.get(rssUrl, { timeout: 8000 });
    const entries = data.feed?.entry || [];
    const tracks = entries.map((t) => {
      const title = t['im:name']?.label || '';
      const artist = t['im:artist']?.label || 'Unknown';
      const album = t['im:collection']?.['im:name']?.label || '';
      const images = t['im:image'] || [];
      const thumbnail = images[images.length - 1]?.label || '';
      
      let previewUrl = '';
      if (Array.isArray(t.link)) {
        const enc = t.link.find(l => l.attributes?.rel === 'enclosure');
        previewUrl = enc?.attributes?.href || '';
      } else if (t.link?.attributes?.rel === 'enclosure') {
        previewUrl = t.link.attributes.href;
      }
      
      const trackId = t.id?.attributes?.['im:id'] || '';
      
      return {
        title,
        artist,
        album,
        thumbnail,
        previewUrl,
        trackId,
        source: 'itunes-rss'
      };
    });
    if (tracks.length > 0) return res.json({ tracks, country, source: 'itunes-rss' });
  } catch (err2) {
    console.error('iTunes RSS trending failed:', err2.message);
  }
  res.json({ tracks: [], country, source: 'none' });
});

// ── Last.fm Recommendations (similar artists) ──
router.get('/recommend', async (req, res) => {
  const { artist, limit = 12 } = req.query;
  if (!artist) return res.status(400).json({ error: 'Missing artist name' });
  if (LASTFM_KEY) {
    try {
      const { data } = await axios.get('https://ws.audioscrobbler.com/2.0/', {
        params: {
          method: 'artist.getsimilar',
          artist,
          api_key: LASTFM_KEY,
          format: 'json',
          limit,
        },
        timeout: 8000,
      });
      const similar = (data.similarartists?.artist || []).map((a) => ({
        name: a.name,
        url: a.url,
        match: parseFloat(a.match) || 0,
        thumbnail: a.image?.find((i) => i.size === 'large')?.['#text'] || '',
      }));
      return res.json({ similar, artist, source: 'lastfm' });
    } catch (err) {
      console.error('Last.fm recommend failed:', err.message);
    }
  }
  try {
    const { data } = await axios.get('https://itunes.apple.com/search', {
      params: { term: artist, limit: Math.min(limit, 20), media: 'music', entity: 'musicArtist' },
      timeout: 8000,
    });
    const similar = (data.results || []).map((a) => ({
      name: a.artistName,
      url: a.artistLinkUrl || '',
      match: 1,
      thumbnail: a.artworkUrl100?.replace('100x100', '300x300') || '',
    }));
    if (similar.length > 0) return res.json({ similar, artist, source: 'itunes' });
  } catch (err2) {
    console.error('iTunes recommend fallback failed:', err2.message);
  }
  res.json({ similar: [], artist, source: 'none' });
});

// ── Last.fm Artist Top Tracks ──
router.get('/artist-top', async (req, res) => {
  const { artist, limit = 10 } = req.query;
  if (!artist) return res.status(400).json({ error: 'Missing artist name' });
  if (LASTFM_KEY) {
    try {
      const { data } = await axios.get('https://ws.audioscrobbler.com/2.0/', {
        params: {
          method: 'artist.gettoptracks',
          artist,
          api_key: LASTFM_KEY,
          format: 'json',
          limit,
        },
        timeout: 8000,
      });
      const tracks = (data.toptracks?.track || []).map((t) => ({
        title: t.name,
        artist: t.artist?.name || artist,
        listeners: parseInt(t.listeners) || 0,
        url: t.url,
        duration: parseInt(t.duration) || 0,
        source: 'lastfm',
      }));
      return res.json({ tracks, artist, source: 'lastfm' });
    } catch (err) {
      console.error('Last.fm artist top failed:', err.message);
    }
  }
  try {
    const { data } = await axios.get('https://itunes.apple.com/search', {
      params: { term: artist, limit: Math.min(limit, 20), media: 'music', entity: 'song' },
      timeout: 8000,
    });
    const tracks = (data.results || []).map((t) => ({
      title: t.trackName,
      artist: t.artistName,
      album: t.collectionName,
      duration: t.trackTimeMillis ? Math.round(t.trackTimeMillis / 1000) : 0,
      thumbnail: t.artworkUrl100?.replace('100x100', '300x300'),
      previewUrl: t.previewUrl || '',
      source: 'itunes',
      trackId: t.trackId,
    }));
    if (tracks.length > 0) return res.json({ tracks, artist, source: 'itunes' });
  } catch (err2) {
    console.error('iTunes artist-top fallback failed:', err2.message);
  }
  res.json({ tracks: [], artist, source: 'none' });
});

// ── Lyrics.ovh ──
router.get('/lyrics', async (req, res) => {
  const { artist, title } = req.query;
  if (!artist || !title) return res.status(400).json({ error: 'Missing artist or title' });
  try {
    const { data } = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, {
      timeout: 8000,
    });
    res.json({ lyrics: data.lyrics || '', artist, title });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.json({ lyrics: '', artist, title, error: 'Not found' });
    }
    res.status(502).json({ error: 'Lyrics fetch failed', detail: err.message });
  }
});

// ── JioSaavn (via third-party proxy) ──
router.get('/jiosaavn/search', async (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });
  try {
    const { data } = await axios.get(`https://www.jiosaavn.com/api.php`, {
      params: {
        __call: 'search.getResults',
        q,
        _format: 'json',
        _marker: 0,
        ctx: 'web6dot0',
        n: limit,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
      timeout: 10000,
    });
    const tracks = (data.results || []).map((t) => ({
      title: t.title || t.song || '',
      artist: t.music || t.singers || t.artist || 'Unknown',
      album: t.album || '',
      duration: t.duration ? parseInt(t.duration) : 0,
      year: t.year || '',
      image_url: t.image || t.album_art || t.thumbnail || '',
      url: t.url || t.perma_url || '',
      media_url: t.media_preview_url || t.media_url || '',
      language: t.language || '',
      source: 'jiosaavn',
      songId: t.id || t.song_id || '',
    }));
    res.json({ tracks, source: 'jiosaavn' });
  } catch (err) {
    res.status(502).json({ error: 'JioSaavn search failed', detail: err.message });
  }
});

// ── JioSaavn Song Details ──
router.get('/jiosaavn/song', async (req, res) => {
  const { id, url } = req.query;
  if (!id && !url) return res.status(400).json({ error: 'Missing song id or url' });
  try {
    const params = { __call: 'song.getDetails', _format: 'json', _marker: 0, ctx: 'web6dot0' };
    if (id) params.pid = id;
    if (url) params.link = url;
    const { data } = await axios.get('https://www.jiosaavn.com/api.php', {
      params,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
      timeout: 10000,
    });
    const s = data.songs?.[0] || data;
    if (!s || !s.title) return res.status(404).json({ error: 'Song not found' });
    const track = {
      title: s.title || s.song || '',
      artist: s.music || s.singers || s.artist || 'Unknown',
      album: s.album || '',
      duration: s.duration ? parseInt(s.duration) : 0,
      year: s.year || '',
      image_url: s.image || '',
      url: s.url || s.perma_url || '',
      media_url: s.media_preview_url || s.media_url || '',
      language: s.language || '',
      lyrics: s.lyrics || '',
      source: 'jiosaavn',
      songId: s.id || '',
    };
    res.json(track);
  } catch (err) {
    res.status(502).json({ error: 'JioSaavn song fetch failed', detail: err.message });
  }
});

// ── JioSaavn Album Details ──
router.get('/jiosaavn/album', async (req, res) => {
  const { id, url } = req.query;
  if (!id && !url) return res.status(400).json({ error: 'Missing album id or url' });
  try {
    const params = { __call: 'album.getDetails', _format: 'json', _marker: 0, ctx: 'web6dot0' };
    if (id) params.albumid = id;
    if (url) params.link = url;
    const { data } = await axios.get('https://www.jiosaavn.com/api.php', {
      params,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
      timeout: 10000,
    });
    const album = {
      title: data.title || data.name || '',
      image: data.image || data.album_art || '',
      year: data.year || data.release_date || '',
      language: data.language || '',
      songs: (data.songs || data.list || []).map((t) => ({
        title: t.title || t.song || '',
        artist: t.music || t.singers || t.artist || 'Unknown',
        duration: t.duration ? parseInt(t.duration) : 0,
        image_url: t.image || '',
        media_url: t.media_preview_url || '',
        source: 'jiosaavn',
      })),
    };
    res.json(album);
  } catch (err) {
    res.status(502).json({ error: 'JioSaavn album fetch failed', detail: err.message });
  }
});

// ── Freesound Ambient Search ──
router.get('/freesound', async (req, res) => {
  if (!FREESOUND_KEY) {
    return res.json({ sounds: [], note: 'Freesound API key not configured; use built-in Web Audio ambient sounds', source: 'builtin' });
  }
  const { q = 'ambient', limit = 12, duration_max = 60 } = req.query;
  try {
    const { data } = await axios.get('https://freesound.org/apiv2/search/text/', {
      params: {
        query: q,
        filter: `duration:[0 TO ${duration_max}]`,
        fields: 'id,name,duration,tags,previews,images',
        page_size: Math.min(limit, 30),
        token: FREESOUND_KEY,
      },
      timeout: 10000,
    });
    const sounds = (data.results || []).map((s) => ({
      id: s.id,
      name: s.name,
      duration: s.duration,
      tags: s.tags || [],
      previewUrl: s.previews?.['preview-lq-mp3'] || s.previews?.['preview-hq-mp3'] || '',
      image: s.images?.waveform_l || s.images?.spectral_l || '',
      source: 'freesound',
    }));
    res.json({ sounds });
  } catch (err) {
    res.status(502).json({ error: 'Freesound search failed', detail: err.message });
  }
});

// ── YouTube Search Fallback (free Invidious API when key missing) ──
router.get('/youtube', async (req, res) => {
  const { q, limit = 5 } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });
  const YT_KEY = process.env.YOUTUBE_API_KEY || '';
  if (YT_KEY) {
    try {
      const { data } = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q,
          type: 'video',
          videoCategoryId: '10',
          maxResults: limit,
          key: YT_KEY,
        },
        timeout: 8000,
      });
      const tracks = (data.items || []).map((t) => ({
        title: t.snippet?.title || '',
        artist: t.snippet?.channelTitle || 'Unknown',
        thumbnail: t.snippet?.thumbnails?.high?.url || t.snippet?.thumbnails?.default?.url || '',
        videoId: t.id?.videoId || '',
        source: 'youtube',
      }));
      return res.json({ tracks, source: 'youtube' });
    } catch (err) {
      console.error('YouTube search failed, trying fallback:', err.message);
    }
  }

  // Try local yt-dlp search if YT_KEY fails or is not provided
  try {
    const { execSync } = require('child_process');
    const result = execSync(
      `yt-dlp --no-warnings --dump-json --default-search "ytsearch" --flat-playlist "ytsearch${limit}:${q.replace(/"/g, '\\"')}"`,
      { timeout: 15000, shell: true, maxBuffer: 5 * 1024 * 1024 }
    );
    const tracks = result.toString().trim().split('\n').filter(Boolean).map((line) => {
      try {
        const d = JSON.parse(line);
        if (d._type === 'playlist') return null;
        let thumbnail = '';
        if (d.thumbnail) thumbnail = d.thumbnail;
        else if (d.thumbnails && d.thumbnails.length > 0) thumbnail = d.thumbnails[d.thumbnails.length - 1]?.url || d.thumbnails[0]?.url || '';
        return {
          title: d.title || '',
          artist: d.channel || d.uploader || 'Unknown',
          thumbnail: thumbnail,
          videoId: d.id || '',
          duration: Math.floor(d.duration || 0),
          source: 'yt-dlp',
        };
      } catch { return null; }
    }).filter(Boolean);
    if (tracks.length > 0) {
      return res.json({ tracks, source: 'yt-dlp' });
    }
  } catch (err) {
    console.error('yt-dlp search fallback in musicRoutes failed:', err.message);
  }

  const invidiousInstances = ['https://inv.nadeko.net', 'https://yewtu.be', 'https://invidious.snopyta.org'];
  for (const instance of invidiousInstances) {
    try {
      const { data } = await axios.get(`${instance}/api/v1/search`, {
        params: { q, type: 'video', limit: Math.min(limit, 10) },
        timeout: 6000,
      });
      const tracks = (data || []).slice(0, limit).map((t) => ({
        title: t.title || '',
        artist: t.author || 'Unknown',
        thumbnail: t.videoThumbnails?.find((th) => th.quality === 'medium')?.url || t.videoThumbnails?.[0]?.url || '',
        videoId: t.videoId || '',
        duration: t.lengthSeconds || 0,
        source: 'invidious',
      }));
      if (tracks.length > 0) return res.json({ tracks, source: 'invidious', instance });
    } catch (err2) {
      console.error(`Invidious ${instance} failed:`, err2.message);
    }
  }
  res.status(502).json({ error: 'YouTube search failed (all sources exhausted)', detail: 'No API key, yt-dlp, and all Invidious instances unreachable or failed' });
});

module.exports = router;
