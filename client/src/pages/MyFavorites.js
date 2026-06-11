import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AnimeHub.css';

const API = process.env.REACT_APP_API_URL;

function MyFavorites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [animeFavs, setAnimeFavs] = useState([]);
  const [mangaFavs, setMangaFavs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('anime');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchFavs = async () => {
      try {
        const [animeRes, mangaRes] = await Promise.all([
          fetch(`${API}/api/favorites/${user._id}?itemType=anime`),
          fetch(`${API}/api/favorites/${user._id}?itemType=manga`),
        ]);
        const [animeData, mangaData] = await Promise.all([animeRes.json(), mangaRes.json()]);
        setAnimeFavs(animeData.data || []);
        setMangaFavs(mangaData.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchFavs();
  }, [user]);

  const removeFav = async (itemType, itemId) => {
    if (!user) return;
    try {
      await fetch(`${API}/api/favorites`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user._id, itemType, itemId }) });
      if (itemType === 'anime') setAnimeFavs((prev) => prev.filter((f) => f.itemId !== itemId));
      else setMangaFavs((prev) => prev.filter((f) => f.itemId !== itemId));
    } catch (e) { }
  };

  const favs = activeTab === 'anime' ? animeFavs : mangaFavs;

  const navLinks = [
    { path: '/anime-hub', label: 'Anime Zone', icon: '🎬' },
    { path: '/anime-hub/manga', label: 'Manga Zone', icon: '📖' },
    { path: '/anime-hub/ghibli', label: 'Ghibli', icon: '🏰' },
    { path: '/anime-hub/trace', label: 'Scene Search', icon: '🔎' },
    { path: '/anime-hub/favorites', label: 'Favorites', icon: '❤️', active: true },
    { path: '/anime-hub/watchlist', label: 'My List', icon: '📋' },
  ];

  if (!user) {
    return (
      <div className="anime-hub">
        <nav className="anime-sidebar">
          <div className="sidebar-brand"><span className="brand-icon">❤️</span><h2>Favorites</h2></div>
          <div className="sidebar-nav">{navLinks.map((l) => (<button key={l.path} className={`sidebar-nav-btn ${l.active ? 'active' : ''}`} onClick={() => navigate(l.path)}><span>{l.icon}</span> {l.label}</button>))}</div>
        </nav>
        <main className="anime-content">
          <div className="empty-state"><span className="empty-icon">🔒</span><p>Please log in to view your favorites</p></div>
        </main>
      </div>
    );
  }

  return (
    <div className="anime-hub">
      <nav className="anime-sidebar">
        <div className="sidebar-brand"><span className="brand-icon">❤️</span><h2>Favorites</h2></div>
        <div className="sidebar-nav">{navLinks.map((l) => (<button key={l.path} className={`sidebar-nav-btn ${l.active ? 'active' : ''}`} onClick={() => navigate(l.path)}><span>{l.icon}</span> {l.label}</button>))}</div>
      </nav>

      <main className="anime-content">
        <header className="anime-header">
          <h1 className="page-title">My Favorites</h1>
          <div className="card-meta">
            <span className="badge" style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}>📺 {animeFavs.length}</span>
            <span className="badge" style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}>📖 {mangaFavs.length}</span>
            <span className="badge" style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}>📊 {animeFavs.length + mangaFavs.length}</span>
          </div>
        </header>

        <div className="search-filters" style={{ marginBottom: '1.5rem' }}>
          <button className={`search-btn ${activeTab === 'anime' ? '' : ''}`} style={{ background: activeTab === 'anime' ? undefined : 'rgba(255,255,255,0.06)', color: activeTab === 'anime' ? undefined : 'rgba(255,255,255,0.6)', padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => setActiveTab('anime')}>📺 Anime ({animeFavs.length})</button>
          <button className={`search-btn ${activeTab === 'manga' ? '' : ''}`} style={{ background: activeTab === 'manga' ? undefined : 'rgba(255,255,255,0.06)', color: activeTab === 'manga' ? undefined : 'rgba(255,255,255,0.6)', padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => setActiveTab('manga')}>📖 Manga ({mangaFavs.length})</button>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : favs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">💔</span>
            <p>No {activeTab} favorites yet</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="search-btn" onClick={() => navigate('/anime-hub')}>Browse Anime</button>
              <button className="search-btn" style={{ background: 'linear-gradient(135deg, #43e97b, #ffa751)' }} onClick={() => navigate('/anime-hub/manga')}>Browse Manga</button>
            </div>
          </div>
        ) : (
          <div className="anime-grid">
            {favs.map((fav) => (
              <div key={fav._id} className="anime-card glass" onClick={() => navigate(activeTab === 'anime' ? `/anime/${fav.itemId}` : `/anime-hub/manga/${fav.itemId}`)}>
                <div className="card-image">
                  <img src={fav.imageUrl || 'https://via.placeholder.com/300x400?text=No+Image'} alt={fav.title} loading="lazy" />
                  <div className="card-overlay">
                    <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); removeFav(activeTab, fav.itemId); }}>❤️</button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="card-title">{fav.title}</div>
                  <div className="card-meta">
                    {fav.score && <span className="badge">⭐ {fav.score}</span>}
                    {fav.type && <span className="badge">{fav.type}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

export default MyFavorites;
