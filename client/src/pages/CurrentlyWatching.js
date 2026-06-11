import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AnimeHub.css';

const API = process.env.REACT_APP_API_URL;

function CurrentlyWatching() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [watchingList, setWatchingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const STATUSES = ['watching', 'plan_to_watch', 'on_hold', 'dropped', 'completed'];

  const fetchWatchingList = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ userId: user._id, itemType: 'anime' });
      if (filter) params.append('status', filter);
      const res = await fetch(`${API}/api/progress?${params}`);
      const data = await res.json();
      setWatchingList(data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [user, filter]);

  useEffect(() => {
    fetchWatchingList();
  }, [fetchWatchingList]);

  const updateStatus = async (entry, newStatus) => {
    try {
      await fetch(`${API}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id, itemType: 'anime', itemId: entry.itemId,
          title: entry.title, imageUrl: entry.imageUrl,
          currentItem: entry.currentItem, totalItems: entry.totalItems,
          status: newStatus,
        }),
      });
      fetchWatchingList();
    } catch (e) { console.error(e); }
  };

  const updateEpisode = async (entry, delta) => {
    const newEp = Math.max(0, Math.min((entry.currentItem || 0) + delta, entry.totalItems || 99999));
    try {
      await fetch(`${API}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id, itemType: 'anime', itemId: entry.itemId,
          title: entry.title, currentItem: newEp,
          status: newEp >= (entry.totalItems || 99999) ? 'completed' : 'watching',
        }),
      });
      fetchWatchingList();
    } catch (e) { console.error(e); }
  };

  const removeEntry = async (entry) => {
    try {
      await fetch(`${API}/api/progress?userId=${user._id}&itemType=anime&itemId=${entry.itemId}`, { method: 'DELETE' });
      fetchWatchingList();
    } catch (e) { console.error(e); }
  };

  const getStatusColor = (status) => {
    const colors = {
      watching: '#43e97b',
      plan_to_watch: '#7c4dff',
      on_hold: '#ffa751',
      dropped: '#ff6b6b',
      completed: '#00d4ff',
    };
    return colors[status] || 'rgba(255,255,255,0.4)';
  };

  const getStatusLabel = (status) => {
    const labels = {
      watching: '📖 Watching',
      plan_to_watch: '📌 Plan to Watch',
      on_hold: '⏸ On Hold',
      dropped: '⛔ Dropped',
      completed: '✅ Completed',
    };
    return labels[status] || status;
  };

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
          <h2>Currently Watching</h2>
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
          <button className={`sidebar-tab ${!filter ? 'active' : ''}`} onClick={() => setFilter('')}>All</button>
          {STATUSES.map((s) => (
            <button key={s} className={`sidebar-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {getStatusLabel(s)}
            </button>
          ))}
        </div>
      </nav>

      <main className="anime-content">
        <header className="anime-header">
          <h1 className="page-title">📺 Watching Tracker</h1>
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>{watchingList.length} entries</span>
        </header>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /><p>Loading...</p></div>
        ) : watchingList.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📺</span>
            <p>No anime tracked yet. Browse and start watching!</p>
            <button className="search-btn" onClick={() => navigate('/anime-hub')} style={{ marginTop: '1rem' }}>Browse Anime</button>
          </div>
        ) : (
          <div className="anime-grid" style={{ gridTemplateColumns: '1fr' }}>
            {watchingList.map((entry) => {
              const progress = entry.totalItems ? Math.round((entry.currentItem / entry.totalItems) * 100) : 0;
              return (
                <div key={entry._id} className="glass" style={{ display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => {
                    if (entry.source === 'gogoanime' || entry.source === 'zoro') {
                      navigate(`/anime-hub/watch?anime=${entry.itemId}&ep=${entry.currentItem || 1}&source=${entry.source}`);
                    } else {
                      navigate(`/anime/${entry.itemId}`);
                    }
                  }}
                >
                  <div style={{ width: '60px', height: '84px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.04)' }}>
                    {entry.imageUrl ? <img src={entry.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', opacity: 0.3 }}>🎬</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{entry.title}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="card-source" style={{ background: `${getStatusColor(entry.status)}20`, color: getStatusColor(entry.status), fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        {getStatusLabel(entry.status)}
                      </span>
                      {entry.totalItems && <span className="badge">Ep {entry.currentItem || 0} / {entry.totalItems}</span>}
                    </div>
                    {entry.totalItems > 0 && (
                      <div style={{ marginTop: '0.4rem', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--anime-accent2), var(--anime-accent))', borderRadius: '2px' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                    <button className="video-btn" onClick={(e) => { e.stopPropagation(); updateEpisode(entry, -1); }} style={{ color: 'rgba(255,255,255,0.6)' }}>-1</button>
                    <button className="video-btn" onClick={(e) => { e.stopPropagation(); updateEpisode(entry, 1); }} style={{ color: 'rgba(255,255,255,0.6)' }}>+1</button>
                    <select value={entry.status} onChange={(e) => { e.stopPropagation(); updateStatus(entry, e.target.value); }} onClick={(e) => e.stopPropagation()}
                      style={{ padding: '0.25rem 0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.72rem' }}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                    <button className="video-btn" onClick={(e) => { e.stopPropagation(); removeEntry(entry); }} style={{ color: '#ff6b6b' }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default CurrentlyWatching;
