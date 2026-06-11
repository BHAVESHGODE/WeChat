import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AnimeHub.css';

const API = process.env.REACT_APP_API_URL;
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function AnimeHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('search');
  const [query, setQuery] = useState('');
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [genre, setGenre] = useState('');
  const [genres, setGenres] = useState([]);
  const [scheduleDay, setScheduleDay] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [season, setSeason] = useState('');
  const [year, setYear] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const currentYear = new Date().getFullYear();
  const seasons = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const fetchTop = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/anime/top?page=${p}&limit=25`);
      const data = await res.json();
      setAnimeList(data.data || []);
      setHasNext(!!data.pagination?.has_next_page);
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const fetchSearch = useCallback(async (p = 1) => {
    if (!query.trim()) { fetchTop(p); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query, page: p, limit: 25 });
      if (genre) params.append('genres', genre);
      const res = await fetch(`${API}/api/anime/search?${params}`);
      const data = await res.json();
      setAnimeList(data.data || []);
      setHasNext(!!data.pagination?.has_next_page);
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [query, genre, fetchTop]);

  const fetchSeasonal = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      let url = `${API}/api/anime/seasonal?page=${p}&limit=25`;
      if (season) url += `&season=${season}`;
      if (year) url += `&year=${year}`;
      const res = await fetch(url);
      const data = await res.json();
      setAnimeList(data.data || []);
      setHasNext(!!data.pagination?.has_next_page);
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [season, year]);

  const fetchSchedules = useCallback(async (day = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 25 });
      if (day) params.append('day', day);
      const res = await fetch(`${API}/api/anime/schedules?${params}`);
      const data = await res.json();
      setAnimeList(data.data || []);
      setHasNext(false);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const fetchGenres = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/anime/genres`);
      const data = await res.json();
      setGenres(data.data || []);
    } catch (e) { }
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API}/api/favorites/${user._id}?itemType=anime`);
      const data = await res.json();
      if (data.data) setFavorites(new Set(data.data.map((f) => f.itemId)));
    } catch (e) { }
  }, [user]);

  const fetchAniList = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, perPage: 25 });
      if (query) params.append('q', query);
      const res = await fetch(`${API}/api/anilist/${query ? 'anime/search' : 'trending'}?${params}`);
      const data = await res.json();
      const items = (data.data || []).map((a) => ({
        mal_id: a.id,
        malId: a.id,
        title: a.title,
        title_english: a.titleEnglish,
        images: { jpg: { large_image_url: a.imageUrl, image_url: a.imageUrl } },
        score: a.score,
        type: a.type || 'ANIME',
        episodes: a.episodes,
        status: a.status,
        season: a.season,
        year: a.year,
        genres: (a.genres || []).map((g) => ({ mal_id: g, name: g })),
        synopsis: a.synopsis,
        source: 'anilist',
      }));
      setAnimeList(items);
      setHasNext(data.pageInfo?.hasNextPage);
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [query]);

  const fetchKitsu = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (query) params.append('q', query);
      const res = await fetch(`${API}/api/kitsu/${query ? 'anime/search' : 'anime/trending'}?${params}`);
      const data = await res.json();
      const items = (data.data || []).map((a) => ({
        mal_id: a.id,
        malId: a.id,
        title: a.title,
        images: { jpg: { large_image_url: a.imageUrl, image_url: a.imageUrl } },
        score: a.score,
        episodes: a.episodes,
        status: a.status,
        genres: (a.genres || []).map((g) => ({ mal_id: g, name: g })),
        synopsis: a.synopsis,
        source: 'kitsu',
      }));
      setAnimeList(items);
      setHasNext(false);
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [query]);

  useEffect(() => {
    fetchGenres();
    fetchTop();
    fetchFavorites();
  }, [fetchTop, fetchGenres, fetchFavorites]);

  useEffect(() => {
    if (activeTab === 'search') fetchSearch(1);
    else if (activeTab === 'top') fetchTop(1);
    else if (activeTab === 'seasonal') fetchSeasonal(1);
    else if (activeTab === 'schedules') fetchSchedules(scheduleDay);
    else if (activeTab === 'anilist') fetchAniList(1);
    else if (activeTab === 'kitsu') fetchKitsu(1);
  }, [activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSearch(1);
  };

  const toggleFavorite = async (item) => {
    if (!user) return navigate('/login');
    try {
      if (favorites.has(item.mal_id)) {
        await fetch(`${API}/api/favorites`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user._id, itemType: 'anime', itemId: item.mal_id }),
        });
        setFavorites((prev) => { const n = new Set(prev); n.delete(item.mal_id); return n; });
      } else {
        await fetch(`${API}/api/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user._id, itemType: 'anime', itemId: item.mal_id,
            title: item.title, imageUrl: item.images?.jpg?.image_url,
            score: item.score, type: item.type, genres: item.genres?.map((g) => g.name),
          }),
        });
        setFavorites((prev) => new Set(prev).add(item.mal_id));
      }
    } catch (e) { console.error(e); }
  };

  const addToWatchList = async (item, status) => {
    if (!user) return navigate('/login');
    try {
      await fetch(`${API}/api/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id, itemType: 'anime', itemId: item.mal_id,
          title: item.title, imageUrl: item.images?.jpg?.image_url,
          score: item.score, type: item.type,
          genres: item.genres?.map((g) => g.name),
          status, total: item.episodes,
        }),
      });
    } catch (e) { console.error(e); }
  };

  const sidebarLinks = [
    { id: 'search', label: 'Search Anime', icon: '🔍' },
    { id: 'top', label: 'Top Anime', icon: '🏆' },
    { id: 'seasonal', label: 'Seasonal', icon: '🌸' },
    { id: 'schedules', label: 'Schedules', icon: '📅' },
    { id: 'anilist', label: 'AniList', icon: '📊' },
    { id: 'kitsu', label: 'Kitsu', icon: '🌟' },
  ];

  const navLinks = [
    { path: '/anime-hub', label: 'Anime Zone', icon: '🎬', active: true },
    { path: '/anime-hub/watch', label: 'Watch Online', icon: '📺' },
    { path: '/anime-hub/manga', label: 'Manga Zone', icon: '📖' },
    { path: '/anime-hub/ghibli', label: 'Ghibli', icon: '🏰' },
    { path: '/anime-hub/trace', label: 'Scene Search', icon: '🔎' },
    { path: '/anime-hub/favorites', label: 'Favorites', icon: '❤️' },
    { path: '/anime-hub/watchlist', label: 'Watch List', icon: '📋' },
    { path: '/anime-hub/tracking', label: 'Tracking', icon: '📊' },
  ];

  return (
    <div className="anime-hub">
      <nav className="anime-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🎬</span>
          <h2>Anime Hub</h2>
        </div>
        <div className="sidebar-nav">
          {navLinks.map((link) => (
            <button key={link.path} className="sidebar-nav-btn" onClick={() => navigate(link.path)}>
              <span>{link.icon}</span> {link.label}
            </button>
          ))}
        </div>
        <div className="sidebar-divider" />
        <div className="sidebar-tabs">
          {sidebarLinks.map((link) => (
            <button
              key={link.id}
              className={`sidebar-tab ${activeTab === link.id ? 'active' : ''}`}
              onClick={() => setActiveTab(link.id)}
            >
              <span>{link.icon}</span> {link.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="anime-content">
        <header className="anime-header">
          <h1 className="page-title">
            {sidebarLinks.find((l) => l.id === activeTab)?.label || 'Anime'}
          </h1>
          <div className="header-actions">
            <div className="view-toggle">
              <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>▦</button>
              <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>☰</button>
            </div>
          </div>
        </header>

        {activeTab === 'search' && (
          <div className="tab-content">
            <form className="search-bar glass" onSubmit={handleSearch}>
              <input
                type="text" placeholder="Search anime by title..."
                value={query} onChange={(e) => setQuery(e.target.value)}
              />
              <div className="search-filters">
                <select value={genre} onChange={(e) => setGenre(e.target.value)}>
                  <option value="">All Genres</option>
                  {genres.map((g) => (
                    <option key={g.mal_id} value={g.mal_id}>{g.name}</option>
                  ))}
                </select>
                <button type="submit" className="search-btn">Search</button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'seasonal' && (
          <div className="tab-content">
            <div className="seasonal-filters glass">
              <select value={season} onChange={(e) => setSeason(e.target.value)}>
                <option value="">All Seasons</option>
                {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">All Years</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <button className="search-btn" onClick={() => fetchSeasonal(1)}>Apply</button>
            </div>
          </div>
        )}

        {activeTab === 'schedules' && (
          <div className="tab-content">
            <div className="schedule-filters glass">
              <div className="day-pills">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    className={`day-pill ${scheduleDay === d ? 'active' : ''}`}
                    onClick={() => { setScheduleDay(d); fetchSchedules(d); }}
                  >{d}</button>
                ))}
                <button className={`day-pill ${!scheduleDay ? 'active' : ''}`} onClick={() => { setScheduleDay(''); fetchSchedules(''); }}>All</button>
              </div>
            </div>
          </div>
        )}

        <div className={`anime-grid ${viewMode}`}>
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /><p>Loading anime...</p></div>
          ) : animeList.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎬</span>
              <p>No anime found. Try a different search!</p>
            </div>
          ) : (
            animeList.map((anime) => (
              <div key={anime.mal_id || anime.malId} className="anime-card glass" onClick={() => navigate(`/anime/${anime.source === 'anilist' || anime.source === 'kitsu' ? anime.mal_id || anime.malId : anime.mal_id}?source=${anime.source || 'jikan'}`)}>
                <div className="card-image">
                  <img src={anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url} alt={anime.title} loading="lazy" />
                  <div className="card-overlay">
                    <button className="card-action-btn favorite-btn" onClick={(e) => { e.stopPropagation(); toggleFavorite(anime); }}>
                      {favorites.has(anime.mal_id) ? '❤️' : '🤍'}
                    </button>
                    <button className="card-action-btn watch-btn" onClick={(e) => { e.stopPropagation(); addToWatchList(anime, 'watching'); }}>
                      ➕
                    </button>
                  </div>
                  {anime.score && <span className="card-score">{anime.score}</span>}
                </div>
                <div className="card-body">
                  <h3 className="card-title">{anime.title}</h3>
                  <div className="card-meta">
                    {anime.type && <span className="badge">{anime.type}</span>}
                    {anime.episodes && <span className="badge">{anime.episodes} eps</span>}
                    {anime.status && <span className="badge status-{anime.status.toLowerCase()}">{anime.status}</span>}
                  </div>
                  <div className="card-genres">
                    {anime.genres?.slice(0, 3).map((g) => (
                      <span key={g.mal_id} className="genre-tag">{g.name}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {hasNext && (
          <div className="pagination">
            <button className="page-btn" onClick={() => fetchSearch(page + 1)}>Load More</button>
          </div>
        )}

      </main>
    </div>
  );
}

export default AnimeHub;
