import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/BookHub.css';

const API = process.env.REACT_APP_API_URL;

function BookDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || 'openlibrary';
  const navigate = useNavigate();
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inLibrary, setInLibrary] = useState(false);
  const [progress, setProgress] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState('');

  const fetchBook = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/books/${id}?source=${source}`);
      const data = await res.json();
      if (data.data) {
        setBook(data.data);
      } else {
        setError('Book not found');
      }
    } catch (e) {
      setError('Failed to load book details');
      console.error(e);
    }
    setLoading(false);
  }, [id, source]);

  const fetchRelated = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/books/related?id=${id}&source=${source}`);
      const data = await res.json();
      setRelated(data.data || []);
    } catch (e) { console.error(e); }
  }, [id, source]);

  const checkProgress = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API}/api/books/progress?userId=${user._id}&sourceId=${id}&source=${source}`);
      const data = await res.json();
      if (data.data?.length > 0) {
        setProgress(data.data[0]);
        setInLibrary(true);
      }
    } catch (e) { console.error(e); }
  }, [user, id, source]);

  useEffect(() => {
    fetchBook();
    fetchRelated();
    checkProgress();
  }, [fetchBook, fetchRelated, checkProgress]);

  const toggleLibrary = async () => {
    if (!user) return navigate('/login');
    try {
      if (inLibrary && progress) {
        await fetch(`${API}/api/books/progress?userId=${user._id}&bookId=${progress._id}`, { method: 'DELETE' });
        setInLibrary(false);
        setProgress(null);
      } else {
        const res = await fetch(`${API}/api/books/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user._id, sourceId: id, source,
            title: book.title, author: book.author, coverUrl: book.coverUrl,
            isFavorite: true,
          }),
        });
        const data = await res.json();
        setProgress(data.data);
        setInLibrary(true);
      }
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="book-hub">
        <main className="book-detail">
          <div className="loading-spinner"><div className="spinner" /><p>Loading book...</p></div>
        </main>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="book-hub">
        <main className="book-detail">
          <div className="empty-state">
            <span className="empty-icon">📖</span>
            <p>{error || 'Book not found'}</p>
            <button className="search-btn" onClick={() => navigate('/books')} style={{ marginTop: '1rem' }}>Back to Books</button>
          </div>
        </main>
      </div>
    );
  }

  const canRead = source === 'gutenberg' || source === 'googlebooks' || source === 'openlibrary' || book.downloadLinks?.text;

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
          <button className="sidebar-nav-btn" onClick={() => navigate('/books/favorites')}>
            <span>📚</span> My Library
          </button>
        </div>
      </nav>

      <main className="book-detail">
        <button className="back-link" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1rem', fontFamily: 'inherit' }}>
          ← Back
        </button>

        <div className="book-detail-header">
          <div className="book-detail-cover">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} />
            ) : (
              <div className="no-cover">📖</div>
            )}
          </div>

          <div className="book-detail-info">
            <h1>{book.title}</h1>
            <p className="book-author">by {book.author}</p>

            <div className="book-metadata">
              {book.publishYear && <span>📅 {book.publishYear}</span>}
              {book.pages && <span>📄 {book.pages} pages</span>}
              <span className={`card-source ${book.source}`}>
                {book.source === 'openlibrary' ? '📖' : book.source === 'gutenberg' ? '📜' : '📕'} {book.source === 'openlibrary' ? 'Open Library' : book.source === 'gutenberg' ? 'Project Gutenberg' : 'Google Books'}
              </span>
              {book.isbn13 && <span>ISBN: {book.isbn13}</span>}
              {book.isbn && !book.isbn13 && <span>ISBN: {book.isbn}</span>}
            </div>

            {book.subjects?.length > 0 && (
              <div className="card-genres" style={{ marginBottom: '1rem' }}>
                {book.subjects.slice(0, 8).map((s, i) => (
                  <span key={i} className="genre-tag" style={{ background: 'rgba(102,126,234,0.1)', color: 'var(--book-accent)' }}>{s}</span>
                ))}
              </div>
            )}

            {book.description && (
              <p className="book-description">{book.description.substring(0, 800)}{book.description.length > 800 ? '...' : ''}</p>
            )}

            <div className="book-detail-actions">
              {canRead && (
                <button className="read-btn" onClick={() => navigate(`/books/reader/${id}?source=${source}`)}>
                  📖 Read Online
                </button>
              )}
              {book.downloadLinks?.epub && (
                <a href={book.downloadLinks.epub} target="_blank" rel="noopener noreferrer" className="action-btn" style={{ textDecoration: 'none' }}>
                  📥 EPUB
                </a>
              )}
              {book.downloadLinks?.pdf && (
                <a href={book.downloadLinks.pdf} target="_blank" rel="noopener noreferrer" className="action-btn" style={{ textDecoration: 'none' }}>
                  📥 PDF
                </a>
              )}
              {book.downloadLinks?.kindle && (
                <a href={book.downloadLinks.kindle} target="_blank" rel="noopener noreferrer" className="action-btn" style={{ textDecoration: 'none' }}>
                  📥 Kindle
                </a>
              )}
              {book.downloadLinks?.text && (
                <a href={book.downloadLinks.text} target="_blank" rel="noopener noreferrer" className="action-btn" style={{ textDecoration: 'none' }}>
                  📥 TXT
                </a>
              )}
              <button className={`action-btn ${inLibrary ? 'active' : ''}`} onClick={toggleLibrary}>
                {inLibrary ? '❤️ In Library' : '🤍 Add to Library'}
              </button>
            </div>

            {progress && progress.progress > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.3rem' }}>Reading Progress: {Math.round(progress.progress)}%</div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress.progress}%`, background: 'linear-gradient(90deg, var(--book-accent), var(--book-accent2))', borderRadius: '2px' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div className="related-books">
            <h3>More by {book.author}</h3>
            <div className="related-grid">
              {related.slice(0, 8).map((r, i) => (
                <div key={i} className="related-card" onClick={() => navigate(`/books/${r.sourceId}?source=${r.source}`)}>
                  {r.coverUrl ? (
                    <img src={r.coverUrl} alt={r.title} className="related-cover" />
                  ) : (
                    <div className="related-cover" style={{ background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', opacity: 0.3 }}>📖</div>
                  )}
                  <div className="related-info">
                    <h4>{r.title}</h4>
                    <span>{r.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default BookDetail;
