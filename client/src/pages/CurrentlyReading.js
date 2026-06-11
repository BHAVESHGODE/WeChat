import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AnimeHub.css';

const API = process.env.REACT_APP_API_URL;

function CurrentlyReading() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [readingList, setReadingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const STATUSES = ['reading', 'plan_to_read', 'on_hold', 'dropped', 'completed'];

  const fetchReadingList = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ userId: user._id, itemType: 'manga' });
      if (filter) params.append('status', filter);
      const res = await fetch(`${API}/api/progress?${params}`);
      const data = await res.json();
      setReadingList(data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [user, filter]);

  useEffect(() => {
    fetchReadingList();
  }, [fetchReadingList]);

  const updateStatus = async (entry, newStatus) => {
    try {
      await fetch(`${API}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id, itemType: 'manga', itemId: entry.itemId,
          title: entry.title, imageUrl: entry.imageUrl,
          currentItem: entry.currentItem, totalItems: entry.totalItems,
          status: newStatus,
        }),
      });
      fetchReadingList();
    } catch (e) { console.error(e); }
  };

  const updateChapter = async (entry, delta) => {
    const newChapter = Math.max(0, Math.min((entry.currentItem || 0) + delta, entry.totalItems || 99999));
    try {
      await fetch(`${API}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id, itemType: 'manga', itemId: entry.itemId,
          title: entry.title, currentItem: newChapter,
          status: newChapter >= (entry.totalItems || 99999) ? 'completed' : 'reading',
        }),
      });
      fetchReadingList();
    } catch (e) { console.error(e); }
  };

  const removeEntry = async (entry) => {
    try {
      await fetch(`${API}/api/progress?userId=${user._id}&itemType=manga&itemId=${entry.itemId}`, { method: 'DELETE' });
      fetchReadingList();
    } catch (e) { console.error(e); }
  };

  const getStatusColor = (status) => {
    const colors = {
      reading: '#43e97b',
      plan_to_read: '#7c4dff',
      on_hold: '#ffa751',
      dropped: '#ff6b6b',
      completed: '#00d4ff',
    };
    return colors[status] || 'rgba(255,255,255,0.4)';
  };

  const getStatusLabel = (status) => {
    const labels = {
      reading: '📖 Reading',
      plan_to_read: '📌 Plan to Read',
      on_hold: '⏸ On Hold',
      dropped: '⛔ Dropped',
      completed: '✅ Completed',
    };
    return labels[status] || status;
  };

  const navLinks = [
    { path: '/anime-hub', label: 'Anime Zone', icon: '🎬' },
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
          <span className="brand-icon">📖</span>
          <h2>Currently Reading</h2>
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
          <h1 className="page-title">📖 Reading Tracker</h1>
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>{readingList.length} entries</span>
        </header>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /><p>Loading...</p></div>
        ) : readingList.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📖</span>
            <p>No manga tracked yet. Browse manga and start reading!</p>
            <button className="search-btn" onClick={() => navigate('/anime-hub/manga')} style={{ marginTop: '1rem' }}>Browse Manga</button>
          </div>
        ) : (
          <div className="anime-grid" style={{ gridTemplateColumns: '1fr' }}>
            {readingList.map((entry) => {
              const progress = entry.totalItems ? Math.round((entry.currentItem / entry.totalItems) * 100) : 0;
              return (
                <div key={entry._id} className="glass" style={{ display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => {
                    if (entry.source === 'mangadex') navigate(`/anime-hub/manga/mangadex/${entry.itemId}`);
                    else if (entry.source === 'asurascans') navigate(`/anime-hub/manga/asura/${entry.itemId}`);
                    else navigate(`/anime-hub/manga/${entry.itemId}`);
                  }}
                >
                  <div style={{ width: '60px', height: '84px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.04)' }}>
                    {entry.imageUrl ? <img src={entry.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', opacity: 0.3 }}>📖</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{entry.title}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="card-source" style={{ background: `${getStatusColor(entry.status)}20`, color: getStatusColor(entry.status), fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        {getStatusLabel(entry.status)}
                      </span>
                      {entry.totalItems && <span className="badge">{entry.currentItem || 0} / {entry.totalItems} ch</span>}
                    </div>
                    {entry.totalItems > 0 && (
                      <div style={{ marginTop: '0.4rem', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--manga-accent), var(--manga-accent2))', borderRadius: '2px' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                    <button className="video-btn" onClick={(e) => { e.stopPropagation(); updateChapter(entry, -1); }} style={{ color: 'rgba(255,255,255,0.6)' }}>-1</button>
                    <button className="video-btn" onClick={(e) => { e.stopPropagation(); updateChapter(entry, 1); }} style={{ color: 'rgba(255,255,255,0.6)' }}>+1</button>
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

export default CurrentlyReading;
