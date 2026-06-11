const axios = require('axios');

const ANILIST_API = 'https://graphql.anilist.co';

async function anilistQuery(query, variables = {}) {
  try {
    const { data } = await axios.post(
      ANILIST_API,
      { query, variables },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 15000 }
    );
    return data.data;
  } catch (err) {
    if (err.response?.status === 429) {
      await new Promise((r) => setTimeout(r, 1000));
      return anilistQuery(query, variables);
    }
    throw err;
  }
}

const SEARCH_ANIME = `
  query ($search: String, $page: Int, $perPage: Int, $genre: String, $season: MediaSeason, $year: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage perPage }
      media(type: ANIME, search: $search, genre: $genre, season: $season, seasonYear: $year, sort: [POPULARITY_DESC, SCORE_DESC]) {
        id idMal title { romaji english native } description
        episodes duration status season seasonYear
        coverImage { large extraLarge } bannerImage
        averageScore meanScore popularity favourites
        genres tags { name } studios { nodes { name } }
        startDate { year month day } endDate { year month day }
        source format
      }
    }
  }
`;

const SEARCH_MANGA = `
  query ($search: String, $page: Int, $perPage: Int, $genre: String) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage perPage }
      media(type: MANGA, search: $search, genre: $genre, sort: [POPULARITY_DESC, SCORE_DESC]) {
        id idMal title { romaji english native } description
        chapters volumes status
        coverImage { large extraLarge } bannerImage
        averageScore meanScore popularity favourites
        genres tags { name }
        startDate { year month day } endDate { year month day }
        countryOfOrigin
      }
    }
  }
`;

const TRENDING = `
  query ($page: Int, $perPage: Int, $type: MediaType) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage perPage }
      media(type: $type, sort: [TRENDING_DESC, POPULARITY_DESC]) {
        id idMal title { romaji english native } description
        episodes chapters volumes duration status season seasonYear
        coverImage { large extraLarge } bannerImage
        averageScore meanScore popularity favourites
        genres tags { name } studios { nodes { name } }
      }
    }
  }
`;

const MEDIA_BY_ID = `
  query ($id: Int) {
    Media(id: $id) {
      id idMal title { romaji english native } description
      episodes chapters volumes duration status season seasonYear
      coverImage { large extraLarge } bannerImage
      averageScore meanScore popularity favourites
      genres tags { name } studios { nodes { name } }
      startDate { year month day } endDate { year month day }
      source format countryOfOrigin
      characters(perPage: 20, sort: [ROLE, RELEVANCE]) {
        edges { role node { id name { full native } image { large } } voiceActors { id name { full } language } }
      }
      recommendations(perPage: 10, sort: [RATING_DESC]) {
        edges { node { mediaRecommendation { id idMal title { romaji english } coverImage { large } } } }
      }
      relations { edges { relationType node { id idMal title { romaji english } type coverImage { large } } } }
    }
  }
`;

function mapAnime(media) {
  return {
    id: media.id,
    malId: media.idMal,
    title: media.title?.romaji || 'Unknown',
    titleEnglish: media.title?.english || '',
    titleNative: media.title?.native || '',
    synopsis: media.description?.replace(/<[^>]*>/g, '').substring(0, 1000) || '',
    episodes: media.episodes,
    duration: media.duration,
    status: media.status,
    season: media.season,
    year: media.seasonYear,
    genres: media.genres || [],
    tags: (media.tags || []).map((t) => t.name),
    score: media.averageScore ? media.averageScore / 10 : null,
    meanScore: media.meanScore,
    popularity: media.popularity,
    favourites: media.favourites,
    imageUrl: media.coverImage?.extraLarge || media.coverImage?.large,
    bannerImage: media.bannerImage,
    studios: media.studios?.nodes?.map((s) => s.name) || [],
    source: 'anilist',
  };
}

function mapManga(media) {
  return {
    id: media.id,
    malId: media.idMal,
    title: media.title?.romaji || 'Unknown',
    titleEnglish: media.title?.english || '',
    titleNative: media.title?.native || '',
    synopsis: media.description?.replace(/<[^>]*>/g, '').substring(0, 1000) || '',
    chapters: media.chapters,
    volumes: media.volumes,
    status: media.status,
    genres: media.genres || [],
    tags: (media.tags || []).map((t) => t.name),
    score: media.averageScore ? media.averageScore / 10 : null,
    popularity: media.popularity,
    favourites: media.favourites,
    imageUrl: media.coverImage?.extraLarge || media.coverImage?.large,
    bannerImage: media.bannerImage,
    countryOfOrigin: media.countryOfOrigin,
    source: 'anilist',
  };
}

async function searchAnimeAL(req, res) {
  try {
    const { q, page = 1, perPage = 20, genre, season, year } = req.query;
    const result = await anilistQuery(SEARCH_ANIME, {
      search: q || undefined,
      page: parseInt(page),
      perPage: Math.min(parseInt(perPage), 50),
      genre: genre || undefined,
      season: season || undefined,
      year: year ? parseInt(year) : undefined,
    });
    const pageInfo = result.Page.pageInfo;
    const anime = (result.Page.media || []).map(mapAnime);
    res.json({ data: anime, pageInfo });
  } catch (err) {
    console.error('AniList search error:', err.message);
    res.status(500).json({ error: 'Failed to search AniList' });
  }
}

async function searchMangaAL(req, res) {
  try {
    const { q, page = 1, perPage = 20, genre } = req.query;
    const result = await anilistQuery(SEARCH_MANGA, {
      search: q || undefined,
      page: parseInt(page),
      perPage: Math.min(parseInt(perPage), 50),
      genre: genre || undefined,
    });
    const pageInfo = result.Page.pageInfo;
    const manga = (result.Page.media || []).map(mapManga);
    res.json({ data: manga, pageInfo });
  } catch (err) {
    console.error('AniList manga search error:', err.message);
    res.status(500).json({ error: 'Failed to search AniList manga' });
  }
}

async function getTrending(req, res) {
  try {
    const { page = 1, perPage = 20, type = 'ANIME' } = req.query;
    const result = await anilistQuery(TRENDING, {
      page: parseInt(page),
      perPage: Math.min(parseInt(perPage), 50),
      type,
    });
    const pageInfo = result.Page.pageInfo;
    const items = (result.Page.media || []).map(type === 'ANIME' ? mapAnime : mapManga);
    res.json({ data: items, pageInfo });
  } catch (err) {
    console.error('AniList trending error:', err.message);
    res.status(500).json({ error: 'Failed to get trending' });
  }
}

async function getMediaById(req, res) {
  try {
    const { id } = req.params;
    const result = await anilistQuery(MEDIA_BY_ID, { id: parseInt(id) });
    const media = result.Media;
    if (!media) return res.status(404).json({ error: 'Media not found' });

    const mapped = media.type === 'ANIME' ? mapAnime(media) : mapManga(media);
    const characters = (media.characters?.edges || []).map((e) => ({
      role: e.role,
      character: {
        id: e.node.id,
        name: e.node.name?.full || 'Unknown',
        nativeName: e.node.name?.native || '',
        image: e.node.image?.large,
      },
      voiceActor: e.voiceActors?.[0] ? { id: e.voiceActors[0].id, name: e.voiceActors[0].name?.full, language: e.voiceActors[0].language } : null,
    }));
    const recommendations = (media.recommendations?.edges || []).map((e) => ({
      id: e.node.mediaRecommendation.id,
      malId: e.node.mediaRecommendation.idMal,
      title: e.node.mediaRecommendation.title?.romaji || 'Unknown',
      image: e.node.mediaRecommendation.coverImage?.large,
    }));
    const relations = (media.relations?.edges || []).map((e) => ({
      relationType: e.relationType,
      id: e.node.id,
      malId: e.node.idMal,
      title: e.node.title?.romaji || 'Unknown',
      type: e.node.type,
      image: e.node.coverImage?.large,
    }));

    res.json({ data: { ...mapped, characters, recommendations, relations } });
  } catch (err) {
    console.error('AniList media error:', err.message);
    res.status(500).json({ error: 'Failed to get media details' });
  }
}

module.exports = {
  searchAnimeAL,
  searchMangaAL,
  getTrending,
  getMediaById,
};
