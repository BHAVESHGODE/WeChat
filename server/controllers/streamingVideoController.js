const axios = require('axios');

const CONSUMET_INSTANCES = [
  'https://consumet-api-hazel.vercel.app',
  'https://consumet-api-inky.vercel.app',
  'https://api.consumet.org',
  'https://consumet-api-1-fcy9.onrender.com',
  'https://consumet-api-2-c3fq.onrender.com',
  'https://shadow-anime-api.vercel.app',
];

const ANIME_PROVIDERS = ['animekai', 'hianime', 'animepahe', 'gogoanime'];

const ANIPUB_API = 'https://api.anipub.xyz';

async function consumetRequest(url, timeout = 12000) {
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'WeGift/1.0', 'Accept': 'application/json' },
    timeout,
  });
  return data;
}

function tryAllProviderInstances(basePath, idParam, timeout = 12000) {
  const errors = [];
  return (async () => {
    for (const instance of CONSUMET_INSTANCES) {
      for (const provider of ANIME_PROVIDERS) {
        try {
          const url = `${instance}/anime/${provider}/${basePath}/${encodeURIComponent(idParam)}`;
          const data = await consumetRequest(url, timeout);
          if (data?.results || data?.episodes || data?.sources) {
            return { data, instance, provider };
          }
        } catch (e) {
          errors.push(`${instance}/${provider}: ${e.message}`);
        }
      }
    }
    return { data: null, error: errors };
  })();
}

async function searchAnime(req, res) {
  try {
    const { q, page = 1 } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query required' });

    let results = [];
    let errors = [];

    for (const instance of CONSUMET_INSTANCES) {
      for (const provider of ANIME_PROVIDERS) {
        try {
          const url = `${instance}/anime/${provider}/${encodeURIComponent(q)}?page=${page}`;
          const data = await consumetRequest(url);
          if (data?.results) {
            const mapped = data.results.map((r) => ({
              id: r.id,
              title: r.title || 'Unknown',
              imageUrl: r.image || r.poster || null,
              episodes: r.episodes || r.totalEpisodes || null,
              status: r.status || null,
              score: r.rating || r.score || null,
              type: r.type || null,
              source: provider,
            }));
            results.push(...mapped);
            if (results.length > 0) break;
          }
        } catch (e) {
          errors.push(`${instance}/${provider}: ${e.message}`);
        }
      }
      if (results.length > 0) break;
    }

    if (results.length === 0) {
      try {
        const { data } = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&page=${page}&limit=25`, { timeout: 10000 });
        if (data?.data) {
          results = data.data.map((r) => ({
            id: String(r.mal_id),
            title: r.title || r.title_english || 'Unknown',
            imageUrl: r.images?.jpg?.large_image_url || r.images?.jpg?.image_url,
            episodes: r.episodes,
            status: r.status,
            score: r.score,
            type: r.type,
            source: 'jikan',
          }));
        }
      } catch (e) {
        errors.push(`jikan: ${e.message}`);
      }
    }

    if (results.length === 0) {
      try {
        const { data } = await axios.get(`${ANIPUB_API}/api/search/${encodeURIComponent(q)}`, { timeout: 10000 });
        if (Array.isArray(data) && data.length > 0) {
          results = data.map((r) => ({
            id: String(r.id || r._id || r.slug || ''),
            title: r.title || r.name || 'Unknown',
            imageUrl: r.image || r.poster || null,
            episodes: r.episodes || r.episodeCount || null,
            score: r.score || r.rating || null,
            source: 'anipub',
          }));
        }
      } catch (e) {
        errors.push(`anipub: ${e.message}`);
      }
    }

    res.json({
      data: results,
      total: results.length,
      errors: errors.length > 0 && results.length === 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('Streaming search error:', err.message);
    res.status(500).json({ error: 'Failed to search anime sources' });
  }
}

async function getAnimeEpisodes(req, res) {
  try {
    const { id, source = 'gogoanime' } = req.query;
    if (!id) return res.status(400).json({ error: 'Anime ID required' });

    if (source === 'jikan') {
      return res.json({ data: [], total: 0, note: 'Jikan provides metadata only. Use gogoanime or zoro source for episode streaming.' });
    }

    const providersToTry = source === 'animekai' ? ['animekai', 'hianime', 'animepahe'] : source === 'hianime' ? ['hianime', 'animekai', 'animepahe'] : ['gogoanime', 'animepahe', 'animekai', 'hianime'];
    let data = null;
    let errors = [];

    for (const instance of CONSUMET_INSTANCES) {
      for (const provider of providersToTry) {
        try {
          const url = `${instance}/anime/${provider}/info/${encodeURIComponent(id)}`;
          const epData = await consumetRequest(url);
          if (epData?.episodes) {
            data = epData.episodes.map((ep) => ({
              id: ep.id,
              number: ep.number,
              title: ep.title || `Episode ${ep.number}`,
              imageUrl: ep.image || null,
              isFiller: ep.isFiller || false,
            }));
            break;
          }
        } catch (e) {
          errors.push(`${instance}/${provider}: ${e.message}`);
        }
      }
      if (data) break;
    }

    if (!data || data.length === 0) {
      try {
        const { data: infoData } = await axios.get(`${ANIPUB_API}/api/info/${encodeURIComponent(id)}`, { timeout: 10000 });
        if (infoData?.episodes || infoData?.episodeCount) {
          const count = infoData.episodeCount || infoData.episodes || 0;
          data = Array.from({ length: count }, (_, i) => ({
            id: `${id}-ep-${i + 1}`,
            number: i + 1,
            title: `Episode ${i + 1}`,
            isFiller: false,
          }));
        }
      } catch (e) {
        errors.push(`anipub: ${e.message}`);
      }
    }

    if (!data || data.length === 0) {
      return res.json({
        data: [],
        total: 0,
        error: 'Episode list unavailable. Streaming sources are temporarily down.',
        errors,
      });
    }

    res.json({ data, total: data.length });
  } catch (err) {
    console.error('Episode list error:', err.message);
    res.status(500).json({ error: 'Failed to get episodes' });
  }
}

async function getVideoLinks(req, res) {
  try {
    const { id, source = 'gogoanime' } = req.query;
    if (!id) return res.status(400).json({ error: 'Episode ID required' });

    let data = null;
    let usedInstance = '';
    let errors = [];

    const providersToTry = source === 'animekai' ? ['animekai', 'hianime', 'animepahe'] : source === 'hianime' ? ['hianime', 'animekai', 'animepahe'] : ['gogoanime', 'animepahe', 'animekai', 'hianime'];

    for (const instance of CONSUMET_INSTANCES) {
      for (const provider of providersToTry) {
        try {
          if (provider === 'zoro') {
            data = await consumetRequest(`${instance}/anime/zoro/watch?episodeId=${encodeURIComponent(id)}`);
          } else {
            data = await consumetRequest(`${instance}/anime/${provider}/watch/${encodeURIComponent(id)}`);
          }
          if (data?.sources || data?.links) {
            usedInstance = `${instance}/${provider}`;
            break;
          }
        } catch (e) {
          errors.push(`${instance}/${provider}: ${e.message}`);
        }
      }
      if (data?.sources || data?.links) break;
    }

    if (!data) {
      try {
        const epMatch = id.match(/ep-(\d+)$/);
        const animeId = id.replace(/-ep-\d+$/, '');
        const epNum = epMatch ? epMatch[1] : 1;
        const { data: anipubData } = await axios.get(`${ANIPUB_API}/anime/api/details/${encodeURIComponent(animeId)}`, { timeout: 10000 });
        if (anipubData?.local?.link) {
          const sources = [];
          if (typeof anipubData.local.link === 'string') {
            sources.push({ url: anipubData.local.link, quality: 'auto', isM3U8: anipubData.local.link.includes('.m3u8') });
          }
          if (anipubData.local.ep && Array.isArray(anipubData.local.ep)) {
            const epIdx = parseInt(epNum) - 2;
            if (epIdx >= 0 && anipubData.local.ep[epIdx]?.link) {
              sources.push({ url: anipubData.local.ep[epIdx].link, quality: 'auto', isM3U8: anipubData.local.ep[epIdx].link.includes('.m3u8') });
            }
          }
          if (sources.length > 0) {
            return res.json({ data: { sources, subtitles: [], headers: {}, instance: 'anipub' } });
          }
        }
      } catch (e) {
        errors.push(`anipub: ${e.message}`);
      }
    }

    if (!data) {
      return res.json({
        data: null,
        error: 'Streaming sources currently unavailable.',
        errors,
      });
    }

    const sources = data?.sources || data?.links || [];
    const subtitles = data?.subtitles || data?.tracks?.filter((t) => t.kind === 'captions') || [];

    const mappedSources = sources.map((s) => ({
      url: s.url,
      quality: s.quality || 'auto',
      isM3U8: s.url?.includes('.m3u8'),
    }));

    const mappedSubtitles = subtitles.map((s) => ({
      url: s.url || s.file,
      lang: s.lang || s.label || s.language || 'Unknown',
    }));

    res.json({
      data: {
        sources: mappedSources,
        subtitles: mappedSubtitles,
        headers: data.headers || {},
        instance: usedInstance,
      },
    });
  } catch (err) {
    console.error('Video links error:', err.message);
    res.json({ data: null, error: 'Failed to get video links' });
  }
}

async function getPopularAnime(req, res) {
  try {
    const { page = 1, source = 'gogoanime' } = req.query;

    let data = null;
    const providersToTry = source === 'animekai' ? ['animekai', 'hianime'] : ['gogoanime', 'animepahe', 'animekai', 'hianime'];

    for (const instance of CONSUMET_INSTANCES) {
      for (const provider of providersToTry) {
        try {
          const url = `${instance}/anime/${provider}/top-airing?page=${page}`;
          data = await consumetRequest(url, 10000);
          if (data?.results) break;
        } catch (e) { continue; }
      }
      if (data?.results) break;
    }

    const results = (data?.results || []).map((r) => ({
      id: r.id,
      title: r.title || 'Unknown',
      imageUrl: r.image || r.poster || null,
      episodes: r.episodes || r.totalEpisodes || null,
      score: r.rating || r.score || null,
      source: source,
    }));

    if (results.length === 0) {
      try {
        const { data: jikanData } = await axios.get(`https://api.jikan.moe/v4/top/anime?page=${page}&limit=25`, { timeout: 10000 });
        if (jikanData?.data) {
          const mapped = jikanData.data.map((r) => ({
            id: String(r.mal_id),
            title: r.title || r.title_english || 'Unknown',
            imageUrl: r.images?.jpg?.large_image_url || r.images?.jpg?.image_url,
            episodes: r.episodes,
            score: r.score,
            type: r.type,
            source: 'jikan',
          }));
          return res.json({ data: mapped, page: parseInt(page) });
        }
      } catch (e) { }
    }

    res.json({ data: results, page: parseInt(page) });
  } catch (err) {
    console.error('Popular anime error:', err.message);
    try {
      const { data: jikanData } = await axios.get(`https://api.jikan.moe/v4/top/anime?page=${1}&limit=25`, { timeout: 10000 });
      if (jikanData?.data) {
        const mapped = jikanData.data.map((r) => ({
          id: String(r.mal_id),
          title: r.title || r.title_english || 'Unknown',
          imageUrl: r.images?.jpg?.large_image_url || r.images?.jpg?.image_url,
          episodes: r.episodes,
          score: r.score,
          type: r.type,
          source: 'jikan',
        }));
        return res.json({ data: mapped, page: 1 });
      }
    } catch (e) { }
    res.json({ data: [], page: parseInt(page) });
  }
}

module.exports = {
  searchAnime,
  getAnimeEpisodes,
  getVideoLinks,
  getPopularAnime,
};
