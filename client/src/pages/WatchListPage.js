import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AnimeHub.css';

const API = process.env.REACT_APP_API_URL;

const STATUS_LABELS = {
  watching: 'Watching', completed: 'Completed', plan_to_watch: 'Plan to Watch',
  on_hold: 'On Hold', dropped: 'Dropped',
};

function WatchListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchList = async () => {
      try {
        const params = new URLSearchParams({ userId: user._id });
        if (filter) params.append('status', filter);
        const res = await fetch(`${API}/api/watchlist?${params}`);
        const data = await res.json();
        setEntries(data.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchList();
  }, [user, filter]);

  const updateStatus = async (entry, newStatus) => {
    try {
      await fetch(`${API}/api/watchlist?userId=${user._id}&itemType=${entry.itemType}&itemId=${entry.itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setEntries((prev) => prev.map((e) => e._id === entry._id ? { ...e, status: newStatus } : e));
    } catch (e) { console.error(e); }
  };

  const removeEntry = async (entry) => {
    try {
      await fetch(`${API}/api/watchlist?userId=${user._id}&itemType=${entry.itemType}&itemId=${entry.itemId}`, { method: 'DELETE' });
      setEntries((prev) => prev.filter((e) => e._id !== entry._id));
    } catch (e) { console.error(e); }
  };

  const navLinks = [
    { path: '/anime-hub', label: 'Anime Zone', icon: '🎬' },
    { path: '/anime-hub/manga', label: 'Manga Zone', icon: '📖' },
    { path: '/anime-hub/ghibli', label: 'Ghibli', icon: '🏰' },
    { path: '/anime-hub/trace', label: 'Scene Search', icon: '🔎' },
    { path: '/anime-hub/favorites', label: 'Favorites', icon: '❤️' },
    { path: '/anime-hub/watchlist', label: 'My List', icon: '📋', active: true },
  ];

  if (!user) {
    return (
      <div className="anime-hub">
        <nav className="anime-sidebar">
          <div className="sidebar-brand"><span className="brand-icon">📋</span><h2>My List</h2></div>
          <div className="sidebar-nav">{navLinks.map((l) => (<button key={l.path} className={`sidebar-nav-btn ${l.active ? 'active' : ''}`} onClick={() => navigate(l.path)}><span>{l.icon}</span> {l.label}</button>))}</div>
        </nav>
        <main className="anime-content">
          <div className="empty-state"><span className="empty-icon">🔒</span><p>Please log in to view your list</p></div>
        </main>
      </div>
    );
  }

  return (
    <div className="anime-hub">
      <nav className="anime-sidebar">
        <div className="sidebar-brand"><span className="brand-icon">📋</span><h2>My List</h2></div>
        <div className="sidebar-nav">{navLinks.map((l) => (<button key={l.path} className={`sidebar-nav-btn ${l.active ? 'active' : ''}`} onClick={() => navigate(l.path)}><span>{l.icon}</span> {l.label}</button>))}</div>
      </nav>

      <main className="anime-content">
        <header className="anime-header">
          <h1 className="page-title">My Watch List</h1>
          <div className="search-filters">
            {['', 'watching', 'completed', 'plan_to_watch', 'on_hold', 'dropped'].map((s) => (
              <button key={s} className={`search-btn`} style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', background: filter === s ? undefined : 'rgba(255,255,255,0.06)', color: filter === s ? undefined : 'rgba(255,255,255,0.6)' }} onClick={() => setFilter(s)}>
                {s ? STATUS_LABELS[s] : 'All'}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <p>Your list is empty</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="search-btn" onClick={() => navigate('/anime-hub')}>Browse Anime</button>
              <button className="search-btn" style={{ background: 'linear-gradient(135deg, #43e97b, #ffa751)' }} onClick={() => navigate('/anime-hub/manga')}>Browse Manga</button>
            </div>
          </div>
        ) : (
          <div className="anime-grid">
            {entries.map((entry) => (
              <div key={entry._id} className="anime-card glass" onClick={() => navigate(entry.itemType === 'anime' ? `/anime/${entry.itemId}` : entry.itemType === 'manga' && entry.source === 'mangadex' ? `/anime-hub/manga/mangadex/${entry.itemId}` : `/anime-hub/manga/${entry.itemId}`)}>
                <div className="card-image">
                  <img src={entry.imageUrl || 'https://via.placeholder.com/200x300'} alt={entry.title} loading="lazy" />
                  <div className="card-overlay">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <select value={entry.status} onChange={(e) => { e.stopPropagation(); updateStatus(entry, e.target.value); }}
                        style={{ padding: '0.2rem 0.4rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', fontSize: '0.65rem', fontFamily: 'inherit', cursor: 'pointer' }}>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                      </select>
                      <button className="card-action-btn" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }} onClick={(e) => { e.stopPropagation(); removeEntry(entry); }}>🗑️</button>
                    </div>
                  </div>
                  <span className="badge" style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: entry.status === 'watching' ? 'rgba(67,233,123,0.2)' : 'rgba(255,255,255,0.1)', color: entry.status === 'watching' ? '#43e97b' : 'rgba(255,255,255,0.6)', fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>
                    {STATUS_LABELS[entry.status]}
                  </span>
                  {entry.itemType === 'anime' ? <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', fontSize: '0.8rem' }}>🎬</span> : <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', fontSize: '0.8rem' }}>📖</span>}
                </div>
                <div className="card-body">
                  <div className="card-title">{entry.title}</div>
                  <div className="card-meta">
                    {entry.score && <span className="badge">⭐ {entry.score}</span>}
                    {entry.progress > 0 && entry.total && <span className="badge">{entry.progress}/{entry.total}</span>}
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

export default WatchListPage;
