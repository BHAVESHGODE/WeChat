import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/BookHub.css';

const API = process.env.REACT_APP_API_URL;

function BookFavorites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLibrary = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/books/progress?userId=${user._id}`);
      const data = await res.json();
      setLibrary(data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const removeBook = async (entry) => {
    try {
      await fetch(`${API}/api/books/progress?userId=${user._id}&bookId=${entry._id}`, { method: 'DELETE' });
      setLibrary((prev) => prev.filter((b) => b._id !== entry._id));
    } catch (e) { console.error(e); }
  };

  const handleOpen = (entry) => {
    if (entry.source === 'gutenberg') {
      navigate(`/books/reader/${entry.sourceId}?source=${entry.source}`);
    } else if (entry.sourceId) {
      navigate(`/books/${entry.sourceId}?source=${entry.source}`);
    }
  };

  const getStatusText = (entry) => {
    if (entry.progress === 100) return '✅ Completed';
    if (entry.progress > 0) return `📖 ${Math.round(entry.progress)}%`;
    return '⏳ Not started';
  };

  return (
    <div className="book-hub">
      <nav className="book-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">📚</span>
          <h2>Book Hub</h2>
        </div>
        <div className="sidebar-nav">
          <button className="sidebar-nav-btn" onClick={() => navigate('/books')}>
            <span>🔍</span> Search Books
          </button>
          <button className="sidebar-nav-btn active" onClick={() => navigate('/books/favorites')}>
            <span>📚</span> My Library
          </button>
        </div>
      </nav>

      <main className="book-content">
        <header className="anime-header">
          <h1 className="page-title">My Library</h1>
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>{library.length} books</span>
        </header>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /><p>Loading library...</p></div>
        ) : library.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📚</span>
            <p>Your library is empty.</p>
            <button className="search-btn" onClick={() => navigate('/books')} style={{ marginTop: '1rem' }}>Discover Books</button>
          </div>
        ) : (
          <div className="book-grid">
            {library.map((entry) => (
              <div key={entry._id} className="book-card glass" onClick={() => handleOpen(entry)}>
                <div className="card-image">
                  {entry.coverUrl ? (
                    <img src={entry.coverUrl} alt={entry.title} loading="lazy" />
                  ) : (
                    <div className="no-cover">📖</div>
                  )}
                  <div className="card-overlay">
                    <button className="card-action-btn favorite-btn" onClick={(e) => { e.stopPropagation(); removeBook(entry); }}>
                      🗑️
                    </button>
                  </div>
                  {entry.progress > 0 && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(0,0,0,0.3)' }}>
                      <div style={{ height: '100%', width: `${entry.progress}%`, background: 'linear-gradient(90deg, var(--book-accent), var(--book-accent2))' }} />
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <h3 className="card-title">{entry.title}</h3>
                  <p className="card-author">{entry.author || 'Unknown'}</p>
                  <div className="card-meta">
                    <span className="badge">{getStatusText(entry)}</span>
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

export default BookFavorites;
