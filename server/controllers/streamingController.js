const PLATFORMS = {
  crunchyroll: {
    name: 'Crunchyroll',
    url: 'https://www.crunchyroll.com/search?q=',
    color: '#f47521',
    icon: 'https://www.crunchyroll.com/favicon.ico',
    regions: ['US', 'CA', 'UK', 'AU', 'IN', 'BR', 'MX', 'FR', 'DE', 'ES', 'IT', 'PT', 'RU', 'SA', 'SE', 'NO', 'DK', 'FI', 'NL', 'PL', 'TR', 'AR', 'CL', 'CO', 'PE'],
  },
  netflix: {
    name: 'Netflix',
    url: 'https://www.netflix.com/search?q=',
    color: '#e50914',
    icon: 'https://www.netflix.com/favicon.ico',
    regions: ['US', 'CA', 'UK', 'AU', 'IN', 'BR', 'MX', 'FR', 'DE', 'ES', 'IT', 'JP', 'KR', 'NL', 'SE', 'NO', 'DK', 'FI', 'PL', 'TR', 'AR'],
  },
  hidive: {
    name: 'HIDIVE',
    url: 'https://www.hidive.com/search?q=',
    color: '#00b4ff',
    icon: 'https://www.hidive.com/favicon.ico',
    regions: ['US', 'CA', 'UK', 'AU', 'NZ'],
  },
  funimation: {
    name: 'Funimation',
    url: 'https://www.funimation.com/search/?q=',
    color: '#7b1fa2',
    icon: 'https://www.funimation.com/favicon.ico',
    regions: ['US', 'CA', 'UK', 'AU', 'NZ', 'IE'],
  },
  animelab: {
    name: 'AnimeLab',
    url: 'https://www.animelab.com/search?q=',
    color: '#ee3a43',
    icon: 'https://www.animelab.com/favicon.ico',
    regions: ['AU', 'NZ'],
  },
  youtube: {
    name: 'YouTube (Official)',
    url: 'https://www.youtube.com/results?search_query=',
    color: '#ff0000',
    icon: 'https://www.youtube.com/favicon.ico',
    regions: ['*'],
  },
  amazon: {
    name: 'Amazon Prime Video',
    url: 'https://www.amazon.com/s?k=',
    color: '#ff9900',
    icon: 'https://www.amazon.com/favicon.ico',
    regions: ['US', 'CA', 'UK', 'AU', 'IN', 'BR', 'MX', 'DE', 'FR', 'ES', 'IT', 'JP'],
  },
  museasia: {
    name: 'Muse Asia',
    url: 'https://www.youtube.com/@MuseAsia/search?query=',
    color: '#ff5722',
    icon: 'https://www.youtube.com/favicon.ico',
    regions: ['AS'],
  },
  anione: {
    name: 'Ani-One Asia',
    url: 'https://www.youtube.com/@AniOneAsia/search?query=',
    color: '#e91e63',
    icon: 'https://www.youtube.com/favicon.ico',
    regions: ['AS'],
  },
  bilibili: {
    name: 'Bilibili',
    url: 'https://www.bilibili.tv/en/search?q=',
    color: '#00a1d6',
    icon: 'https://www.bilibili.com/favicon.ico',
    regions: ['CN', 'AS', 'US'],
  },
  disney: {
    name: 'Disney+',
    url: 'https://www.disneyplus.com/search?q=',
    color: '#113ccf',
    icon: 'https://www.disneyplus.com/favicon.ico',
    regions: ['US', 'CA', 'UK', 'AU', 'IN', 'FR', 'DE', 'ES', 'IT', 'JP', 'KR', 'BR', 'MX'],
  },
};

function getStreamingLinks(req, res) {
  const { title, region = 'US' } = req.query;
  if (!title) return res.status(400).json({ error: 'Missing required parameter: title' });

  const query = encodeURIComponent(title);
  const links = Object.entries(PLATFORMS)
    .filter(([_, p]) => p.regions.includes('*') || p.regions.includes(region))
    .map(([key, p]) => ({
      id: key,
      name: p.name,
      url: `${p.url}${query}`,
      color: p.color,
      icon: p.icon,
    }));

  res.json({ data: links, query: title, region });
}

function getAllPlatforms(req, res) {
  const platforms = Object.entries(PLATFORMS).map(([key, p]) => ({
    id: key,
    name: p.name,
    color: p.color,
    icon: p.icon,
    regions: p.regions,
  }));
  res.json({ data: platforms });
}

module.exports = { getStreamingLinks, getAllPlatforms };
