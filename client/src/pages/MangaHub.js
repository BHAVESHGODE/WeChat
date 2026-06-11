import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AnimeHub.css';

const API = process.env.REACT_APP_API_URL;
const STATUS_OPTIONS = ['', 'publishing', 'completed', 'hiatus', 'discontinued', 'upcoming'];
const STATUS_LABELS = { '': 'All Status', publishing: 'Publishing', completed: 'Completed', hiatus: 'Hiatus', discontinued: 'Discontinued', upcoming: 'Upcoming' };

function MangaHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('jikan');
  const [query, setQuery] = useState('');
  const [mangaList, setMangaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [genre, setGenre] = useState('');
  const [genres, setGenres] = useState([]);
  const [status, setStatus] = useState('');
  const [favorites, setFavorites] = useState(new Set());

  const fetchJikanTop = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/manga/top?page=${p}&limit=25`);
      const data = await res.json();
      setMangaList(data.data || []);
      setHasNext(!!data.pagination?.has_next_page);
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const fetchJikanSearch = useCallback(async (p = 1) => {
    if (!query.trim()) { fetchJikanTop(p); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query, page: p, limit: 25 });
      if (genre) params.append('genres', genre);
      if (status) params.append('status', status);
      const res = await fetch(`${API}/api/manga/search?${params}`);
      const data = await res.json();
      setMangaList(data.data || []);
      setHasNext(!!data.pagination?.has_next_page);
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [query, genre, status, fetchJikanTop]);

  const fetchMangaDex = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 25, offset: (p - 1) * 25 });
      if (query) params.append('q', query);
      if (status) params.append('status', status);
      const res = await fetch(`${API}/api/mangadex/search?${params}`);
      const data = await res.json();
      setMangaList(data.data || []);
      setHasNext(data.total > (p - 1) * 25 + (data.data?.length || 0));
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [query, status]);

  const fetchMangaDexList = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/mangadex/list?limit=25&offset=${(p - 1) * 25}`);
      const data = await res.json();
      setMangaList(data.data || []);
      setHasNext(data.total > (p - 1) * 25 + (data.data?.length || 0));
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const fetchGenres = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/manga/genres`);
      const data = await res.json();
      setGenres(data.data || []);
    } catch (e) { }
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API}/api/favorites/${user._id}?itemType=manga`);
      const data = await res.json();
      if (data.data) setFavorites(new Set(data.data.map((f) => f.itemId)));
    } catch (e) { }
  }, [user]);

  const fetchAniListManga = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, perPage: 25 });
      if (query) params.append('q', query);
      const res = await fetch(`${API}/api/anilist/${query ? 'manga/search' : 'trending'}?${params}&type=MANGA`);
      const data = await res.json();
      const items = (data.data || []).map((m) => ({
        mal_id: m.id,
        malId: m.id,
        title: m.title,
        images: { jpg: { large_image_url: m.imageUrl, image_url: m.imageUrl } },
        score: m.score,
        type: m.type || 'MANGA',
        chapters: m.chapters,
        status: m.status,
        genres: (m.genres || []).map((g) => ({ mal_id: g, name: g })),
        synopsis: m.synopsis,
        source: 'anilist',
      }));
      setMangaList(items);
      setHasNext(data.pageInfo?.hasNextPage);
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [query]);

  const fetchKitsuManga = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (query) params.append('q', query);
      const res = await fetch(`${API}/api/kitsu/${query ? 'manga/search' : 'manga/trending'}?${params}`);
      const data = await res.json();
      const items = (data.data || []).map((m) => ({
        mal_id: m.id,
        malId: m.id,
        title: m.title,
        images: { jpg: { large_image_url: m.imageUrl, image_url: m.imageUrl } },
        score: m.score,
        chapters: m.chapters,
        status: m.status,
        genres: m.genres || [],
        source: 'kitsu',
      }));
      setMangaList(items);
      setHasNext(false);
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [query]);

  const fetchAsuraScans = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 25 });
      if (query) params.append('q', query);
      const res = await fetch(`${API}/api/asurascans/${query ? 'search' : 'list'}?${params}`);
      const data = await res.json();
      const items = (data.data || []).map((m) => ({
        mal_id: m.url?.split('/').filter(Boolean).pop() || m.title,
        malId: m.url?.split('/').filter(Boolean).pop() || m.title,
        title: m.title,
        images: { jpg: { large_image_url: m.imageUrl, image_url: m.imageUrl } },
        chapters: m.latestChapter,
        score: m.rating,
        source: 'asurascans',
      }));
      setMangaList(items);
      setHasNext(data.totalPages > p);
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [query]);

  const fetchComikManga = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query, page: p });
      const res = await fetch(`${API}/api/comik/search?${params}`);
      const data = await res.json();
      const items = (data.data || []).map((m) => ({
        mal_id: m.slug,
        malId: m.slug,
        title: m.title,
        images: { jpg: { large_image_url: m.imageUrl, image_url: m.imageUrl } },
        source: 'comik',
        slug: m.slug,
      }));
      setMangaList(items);
      setHasNext(false);
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [query]);

  const fetchComixManga = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p });
      if (query) params.append('q', query);
      const res = await fetch(`${API}/api/comix/${query ? 'search' : 'list'}?${params}`);
      const data = await res.json();
      const items = (data.data || []).map((m) => ({
        mal_id: m.url?.split('/').filter(Boolean).pop() || m.title,
        malId: m.url?.split('/').filter(Boolean).pop() || m.title,
        title: m.title,
        images: { jpg: { large_image_url: m.imageUrl, image_url: m.imageUrl } },
        chapters: m.latestChapter,
        source: 'comix',
      }));
      setMangaList(items);
      setHasNext(false);
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [query]);

  const fetchCoffeeManga = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p });
      if (query) params.append('q', query);
      const res = await fetch(`${API}/api/coffeemanga/${query ? 'search' : 'list'}?${params}`);
      const data = await res.json();
      const items = (data.data || []).map((m) => ({
        mal_id: m.url?.split('/').filter(Boolean).pop() || m.title,
        malId: m.url?.split('/').filter(Boolean).pop() || m.title,
        title: m.title,
        images: { jpg: { large_image_url: m.imageUrl, image_url: m.imageUrl } },
        chapters: m.latestChapter,
        score: m.rating,
        source: 'coffeemanga',
      }));
      setMangaList(items);
      setHasNext(false);
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [query]);

  useEffect(() => {
    fetchGenres();
    fetchJikanTop();
    fetchFavorites();
  }, [fetchJikanTop, fetchGenres, fetchFavorites]);

  useEffect(() => {
    if (activeTab === 'jikan') {
      query ? fetchJikanSearch(1) : fetchJikanTop(1);
    } else if (activeTab === 'mangadex') {
      query ? fetchMangaDex(1) : fetchMangaDexList(1);
    } else if (activeTab === 'anilist') {
      fetchAniListManga(1);
    } else if (activeTab === 'kitsu') {
      fetchKitsuManga(1);
    } else if (activeTab === 'asurascans') {
      fetchAsuraScans(1);
    } else if (activeTab === 'comik') {
      if (query) fetchComikManga(1);
      else { setMangaList([]); setLoading(false); }
    } else if (activeTab === 'comix') {
      fetchComixManga(1);
    } else if (activeTab === 'coffeemanga') {
      fetchCoffeeManga(1);
    }
  }, [activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (activeTab === 'jikan') fetchJikanSearch(1);
    else if (activeTab === 'comik') fetchComikManga(1);
    else if (activeTab === 'comix') fetchComixManga(1);
    else if (activeTab === 'coffeemanga') fetchCoffeeManga(1);
    else if (query) fetchMangaDex(1);
    else fetchMangaDexList(1);
  };

  const getMangaId = (manga) => manga.mal_id || manga.malId;
  const getMangaTitle = (manga) => manga.title || 'Unknown';
  const getMangaImage = (manga) => manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || manga.imageUrl;
  const getMangaScore = (manga) => manga.score;
  const getMangaType = (manga) => manga.type;
  const getMangaChapters = (manga) => manga.chapters;
  const isMangaDex = (manga) => manga.source === 'mangadex';

  const toggleFavorite = async (manga) => {
    if (!user) return navigate('/login');
    const id = getMangaId(manga);
    try {
      if (favorites.has(id)) {
        await fetch(`${API}/api/favorites`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user._id, itemType: 'manga', itemId: id }),
        });
        setFavorites((prev) => { const n = new Set(prev); n.delete(id); return n; });
      } else {
        await fetch(`${API}/api/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user._id, itemType: 'manga', itemId: id,
            title: getMangaTitle(manga), imageUrl: getMangaImage(manga),
            score: getMangaScore(manga), type: getMangaType(manga),
            genres: manga.genres?.map((g) => g.name || g),
          }),
        });
        setFavorites((prev) => new Set(prev).add(id));
      }
    } catch (e) { console.error(e); }
  };

  const handleCardClick = (manga) => {
    if (isMangaDex(manga)) {
      navigate(`/anime-hub/manga/mangadex/${manga.id}`);
    } else if (manga.source === 'asurascans') {
      navigate(`/anime-hub/manga/${encodeURIComponent(getMangaId(manga))}?source=asurascans`);
    } else if (manga.source === 'comik') {
      navigate(`/anime-hub/manga/${manga.slug}?source=comik`);
    } else if (manga.source === 'comix') {
      navigate(`/anime-hub/manga/${encodeURIComponent(getMangaId(manga))}?source=comix`);
    } else if (manga.source === 'coffeemanga') {
      navigate(`/anime-hub/manga/${encodeURIComponent(getMangaId(manga))}?source=coffeemanga`);
    } else if (manga.source === 'anilist' || manga.source === 'kitsu') {
      navigate(`/anime-hub/manga/${getMangaId(manga)}?source=${manga.source}`);
    } else {
      navigate(`/anime-hub/manga/${getMangaId(manga)}`);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    if (activeTab === 'jikan') {
      query ? fetchJikanSearch(nextPage) : fetchJikanTop(nextPage);
    } else if (activeTab === 'comik' && query) {
      fetchComikManga(nextPage);
    } else if (activeTab === 'comix') {
      fetchComixManga(nextPage);
    } else if (activeTab === 'coffeemanga') {
      fetchCoffeeManga(nextPage);
    } else if (activeTab === 'mangadex') {
      query ? fetchMangaDex(nextPage) : fetchMangaDexList(nextPage);
    }
  };

  const navLinks = [
    { path: '/anime-hub', label: 'Anime Zone', icon: '🎬' },
    { path: '/anime-hub/manga', label: 'Manga Zone', icon: '📖', active: true },
    { path: '/anime-hub/ghibli', label: 'Ghibli', icon: '🏰' },
    { path: '/anime-hub/trace', label: 'Scene Search', icon: '🔎' },
    { path: '/anime-hub/favorites', label: 'Favorites', icon: '❤️' },
    { path: '/anime-hub/watchlist', label: 'My List', icon: '📋' },
  ];

  return (
    <div className="anime-hub manga-hub">
      <nav className="anime-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">📖</span>
          <h2>Manga Hub</h2>
        </div>
        <div className="sidebar-nav">
          {navLinks.map((link) => (
            <button key={link.path} className={`sidebar-nav-btn ${link.active ? 'active' : ''}`} onClick={() => navigate(link.path)}>
              <span>{link.icon}</span> {link.label}
            </button>
          ))}
        </div>
        <div className="sidebar-divider" />
        <div className="sidebar-tabs">
          <button className={`sidebar-tab ${activeTab === 'jikan' ? 'active' : ''}`} onClick={() => setActiveTab('jikan')}>
            <span>📚</span> MAL
          </button>
          <button className={`sidebar-tab ${activeTab === 'mangadex' ? 'active' : ''}`} onClick={() => setActiveTab('mangadex')}>
            <span>📖</span> MangaDex
          </button>
          <button className={`sidebar-tab ${activeTab === 'anilist' ? 'active' : ''}`} onClick={() => setActiveTab('anilist')}>
            <span>📊</span> AniList
          </button>
          <button className={`sidebar-tab ${activeTab === 'kitsu' ? 'active' : ''}`} onClick={() => setActiveTab('kitsu')}>
            <span>🌟</span> Kitsu
          </button>
          <button className={`sidebar-tab ${activeTab === 'asurascans' ? 'active' : ''}`} onClick={() => setActiveTab('asurascans')}>
            <span>📜</span> AsuraScans
          </button>
          <button className={`sidebar-tab ${activeTab === 'comik' ? 'active' : ''}`} onClick={() => setActiveTab('comik')}>
            <span>☕</span> ComiK
          </button>
          <button className={`sidebar-tab ${activeTab === 'comix' ? 'active' : ''}`} onClick={() => setActiveTab('comix')}>
            <span>📖</span> ComiX
          </button>
          <button className={`sidebar-tab ${activeTab === 'coffeemanga' ? 'active' : ''}`} onClick={() => setActiveTab('coffeemanga')}>
            <span>☕</span> CoffeeManga
          </button>
        </div>
      </nav>

      <main className="anime-content">
        <header className="anime-header">
          <h1 className="page-title">{{
            jikan: 'MyAnimeList Manga', mangadex: 'MangaDex', anilist: 'AniList',
            kitsu: 'Kitsu', asurascans: 'AsuraScans', comik: 'ComiK',
            comix: 'ComiX', coffeemanga: 'CoffeeManga',
          }[activeTab] || 'Manga Hub'}</h1>
        </header>

        <div className="tab-content">
          <form className="search-bar glass" onSubmit={handleSearch}>
            <input type="text" placeholder="Search manga by title..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="search-filters">
              {activeTab === 'jikan' && (
                <select value={genre} onChange={(e) => setGenre(e.target.value)}>
                  <option value="">All Genres</option>
                  {genres.map((g) => (<option key={g.mal_id} value={g.mal_id}>{g.name}</option>))}
                </select>
              )}
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{STATUS_LABELS[s]}</option>))}
              </select>
              <button type="submit" className="search-btn">Search</button>
            </div>
          </form>
        </div>

        <div className="anime-grid">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /><p>Loading manga...</p></div>
          ) : mangaList.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📖</span>
              <p>No manga found. Try a different search!</p>
            </div>
          ) : (
            mangaList.map((manga, idx) => (
              <div key={getMangaId(manga) || idx} className="anime-card glass" onClick={() => handleCardClick(manga)}>
                <div className="card-image">
                  <img src={getMangaImage(manga) || 'https://via.placeholder.com/200x300?text=No+Cover'} alt={getMangaTitle(manga)} loading="lazy" />
                  <div className="card-overlay">
                    <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); toggleFavorite(manga); }}>
                      {favorites.has(getMangaId(manga)) ? '❤️' : '🤍'}
                    </button>
                  </div>
                  {getMangaScore(manga) && <span className="card-score">{getMangaScore(manga)}</span>}
                  {isMangaDex(manga) && <span className="card-source-badge">MD</span>}
                  {manga.source === 'asurascans' && <span className="card-source-badge">AS</span>}
                  {manga.source === 'comik' && <span className="card-source-badge">CK</span>}
                  {manga.source === 'comix' && <span className="card-source-badge">CX</span>}
                  {manga.source === 'coffeemanga' && <span className="card-source-badge">CM</span>}
                </div>
                <div className="card-body">
                  <h3 className="card-title">{getMangaTitle(manga)}</h3>
                  <div className="card-meta">
                    {getMangaType(manga) && <span className="badge">{getMangaType(manga)}</span>}
                    {getMangaChapters(manga) && <span className="badge">{getMangaChapters(manga)} ch</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {hasNext && !loading && (
          <div className="pagination">
            <button className="page-btn" onClick={handleLoadMore}>Load More</button>
          </div>
        )}

      </main>
    </div>
  );
}

export default MangaHub;
