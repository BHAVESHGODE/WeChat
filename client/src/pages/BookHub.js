import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/BookHub.css';

const API = process.env.REACT_APP_API_URL;

function BookHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [userBooks, setUserBooks] = useState(new Set());
  const [myLibrary, setMyLibrary] = useState([]);

  const SOURCES = [
    { value: '', label: 'All Sources', icon: '📚' },
    { value: 'openlibrary', label: 'Open Library', icon: '📖' },
    { value: 'gutenberg', label: 'Project Gutenberg', icon: '📜' },
    { value: 'googlebooks', label: 'Google Books', icon: '📕' },
  ];

  const fetchBooks = useCallback(async (q, src = '') => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: q.trim(), limit: 30 });
      if (src) params.append('source', src);
      const res = await fetch(`${API}/api/books/search?${params}`);
      const data = await res.json();
      setBooks(data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const fetchUserBooks = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API}/api/books/progress?userId=${user._id}`);
      const data = await res.json();
      if (data.data) {
        setMyLibrary(data.data);
        const ids = new Set();
        data.data.forEach((b) => {
          if (b.sourceId && b.source) ids.add(`${b.source}:${b.sourceId}`);
          if (b.bookId) ids.add(b.bookId);
        });
        setUserBooks(ids);
      }
    } catch (e) { console.error(e); }
  }, [user]);

  useEffect(() => {
    fetchUserBooks();
  }, [fetchUserBooks]);

  useEffect(() => {
    if (query.trim()) fetchBooks(query, source);
  }, [source]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks(query, source);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch(e);
  };

  const addToLibrary = async (book) => {
    if (!user) return navigate('/login');
    try {
      await fetch(`${API}/api/books/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          sourceId: book.sourceId,
          source: book.source,
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl,
          isFavorite: true,
        }),
      });
      const key = `${book.source}:${book.sourceId}`;
      setUserBooks((prev) => new Set(prev).add(key));
      fetchUserBooks();
    } catch (e) { console.error(e); }
  };

  const removeFromLibrary = async (book) => {
    if (!user) return;
    const key = `${book.source}:${book.sourceId}`;
    const progressEntry = myLibrary.find(
      (p) => (p.sourceId === book.sourceId && p.source === book.source) || (book._id && p.bookId === book._id)
    );
    if (!progressEntry) return;
    try {
      await fetch(`${API}/api/books/progress?userId=${user._id}&bookId=${progressEntry._id}`, {
        method: 'DELETE',
      });
      setUserBooks((prev) => { const n = new Set(prev); n.delete(key); return n; });
      fetchUserBooks();
    } catch (e) { console.error(e); }
  };

  const isInLibrary = (book) => {
    const key = `${book.source}:${book.sourceId}`;
    return userBooks.has(key);
  };

  const getSourceIcon = (src) => {
    const s = SOURCES.find((s) => s.value === src);
    return s ? s.icon : '📚';
  };

  const sidebarLinks = [
    { id: 'search', label: 'Search Books', icon: '🔍' },
    { id: 'library', label: 'My Library', icon: '📚' },
  ];

  const [activeTab, setActiveTab] = useState('search');

  return (
    <div className="book-hub">
      <nav className="book-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">📚</span>
          <h2>Book Hub</h2>
        </div>
        <div className="sidebar-nav">
          {sidebarLinks.map((link) => (
            <button
              key={link.id}
              className={`sidebar-nav-btn ${activeTab === link.id ? 'active' : ''}`}
              onClick={() => setActiveTab(link.id)}
            >
              <span>{link.icon}</span> {link.label}
            </button>
          ))}
        </div>
        <div className="sidebar-divider" />
        <div className="sidebar-tabs">
          {SOURCES.map((s) => (
            <button
              key={s.value}
              className={`sidebar-tab ${source === s.value ? 'active' : ''}`}
              onClick={() => setSource(s.value)}
            >
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="book-content">
        {activeTab === 'search' ? (
          <>
            <header className="anime-header">
              <h1 className="page-title">Discover Books</h1>
              <div className="header-actions">
                <div className="view-toggle">
                  <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>▦</button>
                  <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>☰</button>
                </div>
              </div>
            </header>

            <form className="search-bar glass" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search books by title, author, or keyword..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <div className="search-filters">
                <button type="submit" className="search-btn">Search</button>
              </div>
            </form>

            <div className="book-grid" style={{ display: viewMode === 'list' ? 'flex' : undefined, flexDirection: viewMode === 'list' ? 'column' : undefined }}>
              {loading ? (
                <div className="loading-spinner"><div className="spinner" /><p>Searching books...</p></div>
              ) : books.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📚</span>
                  <p>{query ? 'No books found. Try a different search!' : 'Enter a search term to discover books'}</p>
                </div>
              ) : (
                books.map((book, idx) => (
                  <div key={`${book.source}-${book.sourceId}-${idx}`} className="book-card glass" onClick={() => navigate(`/books/${book.sourceId}?source=${book.source}`)}>
                    <div className="card-image">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} loading="lazy" />
                      ) : (
                        <div className="no-cover">📖</div>
                      )}
                      <div className="card-overlay">
                        <button className="card-action-btn favorite-btn" onClick={(e) => { e.stopPropagation(); isInLibrary(book) ? removeFromLibrary(book) : addToLibrary(book); }}>
                          {isInLibrary(book) ? '❤️' : '🤍'}
                        </button>
                      </div>
                    </div>
                    <div className="card-body">
                      <h3 className="card-title">{book.title}</h3>
                      <p className="card-author">{book.author}</p>
                      <div className="card-meta">
                        <span className={`card-source ${book.source}`}>{getSourceIcon(book.source)} {book.source}</span>
                        {book.publishYear && <span className="card-year">{book.publishYear}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <header className="anime-header">
              <h1 className="page-title">My Library</h1>
            </header>

            {myLibrary.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📚</span>
                <p>Your library is empty. Search and add books to get started!</p>
              </div>
            ) : (
              <div className="book-grid">
                {myLibrary.map((entry) => (
                  <div
                    key={entry._id}
                    className="book-card glass"
                    onClick={() => {
                      if (entry.source === 'gutenberg') {
                        navigate(`/books/reader/${entry.sourceId}`);
                      } else {
                        navigate(`/books/${entry.sourceId}?source=${entry.source}`);
                      }
                    }}
                  >
                    <div className="card-image">
                      {entry.coverUrl ? (
                        <img src={entry.coverUrl} alt={entry.title} loading="lazy" />
                      ) : (
                        <div className="no-cover">📖</div>
                      )}
                    </div>
                    <div className="card-body">
                      <h3 className="card-title">{entry.title}</h3>
                      <p className="card-author">{entry.author || 'Unknown'}</p>
                      <div className="card-meta">
                        {entry.progress > 0 && <span className="badge">{Math.round(entry.progress)}%</span>}
                        {entry.source === 'gutenberg' && <span className="card-source gutenberg">📜 gutenberg</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default BookHub;
