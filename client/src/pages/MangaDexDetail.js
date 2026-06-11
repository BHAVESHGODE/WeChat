import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AnimeHub.css';

const API = process.env.REACT_APP_API_URL;

function MangaDexDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  useEffect(() => {
    const fetchManga = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/mangadex/${id}`);
        const data = await res.json();
        setManga(data.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchManga();
  }, [id]);

  useEffect(() => {
    if (!manga) return;
    const fetchChapters = async () => {
      setChaptersLoading(true);
      try {
        const res = await fetch(`${API}/api/mangadex/${id}/chapters?limit=500`);
        const data = await res.json();
        const sorted = (data.data || []).sort((a, b) => (b.chapter || 0) - (a.chapter || 0));
        setChapters(sorted);
      } catch (e) { console.error(e); }
      setChaptersLoading(false);
    };
    fetchChapters();
  }, [manga, id]);

  if (loading) {
    return (
      <div className="anime-hub">
        <main className="anime-content">
          <div className="loading-spinner"><div className="spinner" /><p>Loading manga...</p></div>
        </main>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="anime-hub">
        <main className="anime-content">
          <div className="empty-state"><span className="empty-icon">❌</span><p>Manga not found</p>
            <button className="search-btn" onClick={() => navigate('/anime-hub/manga')}>Back</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="anime-hub">
      <main className="anime-content" style={{ maxHeight: 'none', paddingBottom: '5rem' }}>
        <header className="anime-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="sidebar-nav-btn" onClick={() => navigate('/anime-hub/manga')} style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>← Back</button>
            <h1 className="page-title" style={{ fontSize: '1.2rem' }}>MangaDex</h1>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {manga.imageUrl && (
            <div style={{ flexShrink: 0, width: '250px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <img src={manga.imageUrl} alt={manga.title} style={{ width: '100%', display: 'block' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>{manga.title}</h1>
            {manga.altTitles?.length > 0 && <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }}>{manga.altTitles.slice(0, 3).join(', ')}</div>}
            <div className="card-meta" style={{ marginBottom: '1rem' }}>
              <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>MD</span>
              {manga.status && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>{manga.status}</span>}
              {manga.year && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>{manga.year}</span>}
              {manga.chapters && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>{manga.chapters} ch</span>}
              {manga.contentRating && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>{manga.contentRating}</span>}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: '1rem' }}>{manga.synopsis || 'No synopsis available.'}</p>
            {manga.genres?.length > 0 && (
              <div className="card-genres" style={{ marginBottom: '0.75rem' }}>
                {manga.genres.map((g, i) => (<span key={i} className="genre-tag" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>{g}</span>))}
              </div>
            )}
            {manga.authors?.length > 0 && (
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>
                {manga.authors.map((a) => a.name).join(', ')}
              </div>
            )}
            <a href={`https://mangadex.org/title/${id}`} target="_blank" rel="noopener noreferrer" className="search-btn" style={{ background: 'linear-gradient(135deg, #ff6f00, #ffa726)', padding: '0.4rem 1rem', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem' }}>
              📖 Open on MangaDex.org
            </a>
          </div>
        </div>

        <div className="glass" style={{ padding: '1.25rem' }}>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.75rem', fontSize: '1rem' }}>📖 Chapters ({chapters.length})</h3>
          {chaptersLoading ? (
            <div className="loading-spinner"><div className="spinner" /><p>Loading chapters...</p></div>
          ) : chapters.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>No translated chapters available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '500px', overflowY: 'auto' }}>
              {chapters.map((ch) => (
                <div key={ch.id} className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', cursor: 'pointer', margin: 0, borderRadius: '8px' }}
                  onClick={() => navigate(`/anime-hub/manga/reader/mangadex/${ch.id}`)}>
                  <div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Ch. {ch.chapter}</span>
                    {ch.title && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{ch.title}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>{ch.group}</span>
                    {ch.pages && <span className="badge">{ch.pages}p</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default MangaDexDetail;
