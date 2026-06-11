import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AnimeHub.css';

const API = process.env.REACT_APP_API_URL;

function TraceMoe() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true); setError(''); setResults([]);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API}/api/trace/search`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.results) setResults(data.results);
      else setError(data.error || 'No results found');
    } catch (e) { setError('Failed to search. Check file size (max 10MB).'); }
    setLoading(false);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleFileSelect = (e) => handleFile(e.target.files[0]);

  const handleUrlSearch = async () => {
    if (!urlInput.trim()) return;
    setLoading(true); setError(''); setResults([]);
    try {
      const res = await fetch(`${API}/api/trace/search-url`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: urlInput.trim() }) });
      const data = await res.json();
      if (data.results) setResults(data.results);
      else setError(data.error || 'No results found');
    } catch (e) { setError('Failed to search URL.'); }
    setLoading(false);
  };

  const getSimilarityClass = (sim) => sim >= 0.85 ? 'high' : sim >= 0.7 ? 'medium' : 'low';
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return 'Unknown';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const navLinks = [
    { path: '/anime-hub', label: 'Anime Zone', icon: '🎬' },
    { path: '/anime-hub/manga', label: 'Manga Zone', icon: '📖' },
    { path: '/anime-hub/ghibli', label: 'Ghibli', icon: '🏰' },
    { path: '/anime-hub/trace', label: 'Scene Search', icon: '🔎', active: true },
    { path: '/anime-hub/favorites', label: 'Favorites', icon: '❤️' },
    { path: '/anime-hub/watchlist', label: 'My List', icon: '📋' },
  ];

  return (
    <div className="anime-hub">
      <nav className="anime-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🔎</span>
          <h2>Scene Search</h2>
        </div>
        <div className="sidebar-nav">
          {navLinks.map((link) => (
            <button key={link.path} className={`sidebar-nav-btn ${link.active ? 'active' : ''}`} onClick={() => navigate(link.path)}>
              <span>{link.icon}</span> {link.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="anime-content">
        <header className="anime-header">
          <h1 className="page-title">Anime Scene Search</h1>
        </header>

        <div className="glass" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}
          onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
          onClick={() => fileRef.current?.click()}
          style={dragOver ? { borderColor: 'var(--anime-accent)', background: 'rgba(255,107,157,0.08)' } : { padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🖼️</div>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 0.25rem' }}>Drop a screenshot here or click to upload</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>Supports JPG, PNG, WebP (max 10MB)</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <input type="text" placeholder="Or paste an image URL..." value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            style={{ flex: 1, padding: '0.7rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none', color: 'var(--text-primary)' }} />
          <button className="search-btn" onClick={handleUrlSearch} disabled={loading || !urlInput.trim()}>Search</button>
        </div>

        {loading && <div className="loading-spinner"><div className="spinner" /><p>Searching anime databases...</p></div>}

        {error && <div className="glass" style={{ padding: '1rem', color: 'var(--anime-accent)', marginBottom: '1rem' }}>{error}</div>}

        {results.length > 0 && (
          <div>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 1rem', fontSize: '1rem' }}>Results ({results.length})</h3>
            {results.map((r, i) => (
              <div key={i} className="glass" style={{ display: 'flex', gap: '1rem', padding: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {r.video && <video src={r.video} controls preload="metadata" poster={r.image || undefined} style={{ width: '240px', borderRadius: '10px', flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{r.anime}</div>
                  {r.titleEnglish && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{r.titleEnglish}</div>}
                  {r.titleNative && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{r.titleNative}</div>}
                  <div className="card-meta" style={{ marginBottom: '0.5rem' }}>
                    {r.episode && <span className="badge">Episode {r.episode}</span>}
                    <span className="badge">{formatTime(r.from)} - {formatTime(r.to)}</span>
                  </div>
                  <div style={{ color: r.similarity >= 0.85 ? '#43e97b' : r.similarity >= 0.7 ? '#ffd700' : '#ff6b9d', fontWeight: 700, fontSize: '0.9rem' }}>
                    Match: {(r.similarity * 100).toFixed(1)}% confidence
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

export default TraceMoe;
