import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VideoPlayer from './VideoPlayer';
import '../styles/VideoPlayer.css';
import '../styles/AnimeHub.css';

const API = process.env.REACT_APP_API_URL;

function AnimeWatch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const animeIdFromUrl = searchParams.get('anime') || '';
  const epFromUrl = searchParams.get('ep') || '';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [source, setSource] = useState('gogoanime');
  const [episodeLoading, setEpisodeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(animeIdFromUrl ? 'watch' : 'search');
  const [error, setError] = useState('');

  const SOURCES = [
    { value: 'gogoanime', label: 'GogoAnime' },
    { value: 'zoro', label: 'Zoro' },
  ];

  const searchAnime = useCallback(async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/streaming-video/search?q=${encodeURIComponent(q)}&source=${source}`);
      const data = await res.json();
      setResults(data.data || []);
      if (data.errors && data.errors.length > 0 && (!data.data || data.data.length === 0)) {
        setError('Streaming sources are temporarily unavailable. Try a different source in the sidebar.');
      }
    } catch (e) { setError('Failed to connect to streaming service'); console.error(e); }
    setLoading(false);
  }, [source]);

  const fetchEpisodes = useCallback(async (id) => {
    if (!id) return;
    setEpisodeLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/streaming-video/episodes?id=${encodeURIComponent(id)}&source=${source}`);
      const data = await res.json();
      const eps = data.data || [];
      setEpisodes(eps);

      if (eps.length > 0) {
        const targetEp = epFromUrl ? eps.find((e) => String(e.number) === epFromUrl) : eps[0];
        if (targetEp) {
          setCurrentEpisode(targetEp);
          setSearchParams({ anime: id, ep: targetEp.number, source });
        } else {
          setCurrentEpisode(eps[0]);
        }
      } else if (data.error) {
        setError(data.error);
      }
    } catch (e) { setError('Failed to load episodes'); console.error(e); }
    setEpisodeLoading(false);
  }, [source, epFromUrl, setSearchParams]);

  useEffect(() => {
    if (animeIdFromUrl) {
      setSelectedAnime({ id: animeIdFromUrl });
      fetchEpisodes(animeIdFromUrl);
    }
  }, [animeIdFromUrl, fetchEpisodes]);

  const handleSelectAnime = (anime) => {
    setSelectedAnime(anime);
    setActiveTab('watch');
    setSearchParams({ anime: anime.id, ep: 1, source });
    fetchEpisodes(anime.id);
  };

  const handleEpisodeChange = (ep) => {
    setCurrentEpisode(ep);
    setSearchParams({ anime: selectedAnime?.id, ep: ep.number, source });
  };

  const currentIdx = episodes.findIndex((e) => e.id === currentEpisode?.id);

  const saveProgress = async () => {
    if (!user || !selectedAnime || !currentEpisode) return;
    try {
      await fetch(`${API}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id, itemType: 'anime', itemId: selectedAnime.id,
          source, title: selectedAnime.title, imageUrl: selectedAnime.imageUrl,
          currentItem: currentEpisode.number, totalItems: episodes.length,
          status: currentEpisode.number >= episodes.length ? 'completed' : 'watching',
        }),
      });
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (currentEpisode) saveProgress();
  }, [currentEpisode?.number]);

  const sidebarLinks = [
    { id: 'search', label: 'Search Anime', icon: '🔍' },
    { id: 'watch', label: 'Watch', icon: '🎬' },
  ];

  const navLinks = [
    { path: '/anime-hub', label: 'Anime Zone', icon: '🎬' },
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
          <span className="brand-icon">📺</span>
          <h2>Watch Anime</h2>
        </div>
        <div className="sidebar-nav">
          {navLinks.map((link) => (
            <button key={link.path} className={`sidebar-nav-btn ${window.location.pathname === link.path ? 'active' : ''}`} onClick={() => navigate(link.path)}>
              <span>{link.icon}</span> {link.label}
            </button>
          ))}
        </div>
        <div className="sidebar-divider" />
        <div className="sidebar-tabs">
          {sidebarLinks.map((link) => (
            <button key={link.id} className={`sidebar-tab ${activeTab === link.id ? 'active' : ''}`} onClick={() => setActiveTab(link.id)}>
              <span>{link.icon}</span> {link.label}
            </button>
          ))}
        </div>
        <div className="sidebar-divider" />
        <div style={{ padding: '0 1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stream Source</div>
          {SOURCES.map((s) => (
            <button key={s.value} className={`sidebar-tab ${source === s.value ? 'active' : ''}`} onClick={() => setSource(s.value)}>
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="anime-content">
        {activeTab === 'search' && (
          <>
            <header className="anime-header">
              <h1 className="page-title">Search Anime to Watch</h1>
            </header>
            <form className="search-bar glass" onSubmit={(e) => { e.preventDefault(); searchAnime(query); }}>
              <input type="text" placeholder="Search anime to watch online..." value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
              <button type="submit" className="search-btn">Search</button>
            </form>

            {error && activeTab === 'search' && (
              <div className="empty-state" style={{ marginTop: '1rem' }}>
                <span className="empty-icon">⚠️</span>
                <p style={{ color: 'rgba(255,200,100,0.8)', fontSize: '0.85rem' }}>{error}</p>
              </div>
            )}
            {loading ? (
              <div className="loading-spinner"><div className="spinner" /><p>Searching...</p></div>
            ) : results.length > 0 ? (
              <div className="anime-grid">
                {results.map((r, i) => (
                  <div key={i} className="anime-card glass" onClick={() => handleSelectAnime(r)}>
                    <div className="card-image">
                      <img src={r.imageUrl || 'https://via.placeholder.com/200x280'} alt={r.title} loading="lazy" />
                      <div className="card-overlay">
                        <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); handleSelectAnime(r); }}>▶</button>
                      </div>
                      {r.score && <span className="card-score">⭐ {r.score}</span>}
                    </div>
                    <div className="card-body">
                      <h3 className="card-title">{r.title}</h3>
                      <div className="card-meta">
                        {r.episodes && <span className="badge">{r.episodes} eps</span>}
                        <span className="badge">{r.source}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : query && !loading ? (
              <div className="empty-state"><span className="empty-icon">🎬</span><p>No results found</p></div>
            ) : (
              <div className="empty-state"><span className="empty-icon">📺</span><p>Search for anime to start watching</p></div>
            )}
          </>
        )}

        {activeTab === 'watch' && (
          <>
            <header className="anime-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button className="sidebar-nav-btn" onClick={() => { setActiveTab('search'); setSelectedAnime(null); }} style={{ width: 'auto', padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}>← Back</button>
                <h1 className="page-title" style={{ fontSize: '1.2rem' }}>{selectedAnime?.title || 'Player'}</h1>
              </div>
            </header>

            {currentEpisode && (
              <VideoPlayer
                episodeId={currentEpisode.id}
                animeTitle={selectedAnime?.title}
                episodeNumber={currentEpisode.number}
                source={source}
                onPrev={() => currentIdx > 0 && handleEpisodeChange(episodes[currentIdx - 1])}
                onNext={() => currentIdx < episodes.length - 1 && handleEpisodeChange(episodes[currentIdx + 1])}
                hasPrev={currentIdx > 0}
                hasNext={currentIdx < episodes.length - 1}
              />
            )}

            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>Episodes ({episodes.length})</h3>
                <select
                  className="episode-select"
                  value={currentEpisode?.id || ''}
                  onChange={(e) => {
                    const ep = episodes.find((ep) => ep.id === e.target.value);
                    if (ep) handleEpisodeChange(ep);
                  }}
                  style={{ padding: '0.4rem 0.7rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.82rem', maxWidth: '300px' }}
                >
                  {episodes.map((ep) => (
                    <option key={ep.id} value={ep.id}>Episode {ep.number}{ep.title ? ` - ${ep.title}` : ''}</option>
                  ))}
                </select>
              </div>

              {error && activeTab === 'watch' && (
                <div className="empty-state">
                  <span className="empty-icon">⚠️</span>
                  <p style={{ color: 'rgba(255,200,100,0.8)', fontSize: '0.85rem' }}>{error}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', marginTop: '0.5rem' }}>Try switching to Zoro source in the sidebar</p>
                </div>
              )}
              {episodeLoading ? (
                <div className="loading-spinner"><div className="spinner" /><p>Loading episodes...</p></div>
              ) : (
                <div className="episode-grid">
                  {episodes.map((ep) => (
                    <button key={ep.id} className={`episode-card ${ep.id === currentEpisode?.id ? 'active' : ''} ${ep.isFiller ? 'filler' : ''}`} onClick={() => handleEpisodeChange(ep)}>
                      <span className="episode-number">Ep {ep.number}</span>
                      {ep.title || ''}
                      {ep.isFiller && <span className="badge" style={{ marginLeft: '0.3rem' }}>Filler</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AnimeWatch;
