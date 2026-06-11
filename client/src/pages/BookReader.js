import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/BookHub.css';

const API = process.env.REACT_APP_API_URL;

function BookReader() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || 'gutenberg';
  const navigate = useNavigate();
  const { user } = useAuth();
  const contentRef = useRef(null);

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookMeta, setBookMeta] = useState(null);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState('sepia');
  const [progress, setProgress] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [bookmarks, setBookmarks] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [progressId, setProgressId] = useState(null);
  const [selection, setSelection] = useState('');
  const [error, setError] = useState('');
  const [autoSave, setAutoSave] = useState(true);
  const [externalReaderUrl, setExternalReaderUrl] = useState(null);
  const [externalReaderLabel, setExternalReaderLabel] = useState('External Reader');
  const [iaId, setIaId] = useState(null);
  const [embeddable, setEmbeddable] = useState(false);
  const [showExternalReader, setShowExternalReader] = useState(false);

  const fetchText = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [textRes, bookRes] = await Promise.all([
        fetch(`${API}/api/books/text/${id}?source=${source}`),
        fetch(`${API}/api/books/${id}?source=${source}`),
      ]);
      const textData = await textRes.json();
      const bookData = await bookRes.json();

      if (textData.data?.text) {
        setText(textData.data.text);
        setCharCount(textData.data.totalChars || textData.data.text.length);
        if (textData.data.externalReaderUrl) {
          setExternalReaderUrl(textData.data.externalReaderUrl);
          setExternalReaderLabel(textData.data.externalReaderLabel || 'External Reader');
          setIaId(textData.data.iaId || null);
          setEmbeddable(textData.data.embeddable || false);
        }
      } else {
        setError(textData.error || 'Could not load book text');
      }

      if (bookData.data) {
        setBookMeta(bookData.data);
      }
    } catch (e) {
      setError('Failed to load book');
      console.error(e);
    }
    setLoading(false);
  }, [id, source]);

  const fetchProgress = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API}/api/books/progress?userId=${user._id}&sourceId=${id}&source=${source}`);
      const data = await res.json();
      if (data.data?.length > 0) {
        const p = data.data[0];
        setProgressId(p._id);
        setFontSize(p.fontSize || 18);
        setTheme(p.theme || 'sepia');
        setProgress(p.progress || 0);
        setBookmarks(p.bookmarks || []);
        setHighlights(p.highlights || []);
      }
    } catch (e) { console.error(e); }
  }, [user, id, source]);

  useEffect(() => {
    fetchText();
    fetchProgress();
  }, [fetchText, fetchProgress]);

  const saveProgress = useCallback(async (data) => {
    if (!user) return;
    try {
      const res = await fetch(`${API}/api/books/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          bookId: progressId,
          sourceId: id,
          source,
          title: bookMeta?.title,
          author: bookMeta?.author,
          coverUrl: bookMeta?.coverUrl,
          ...data,
        }),
      });
      const result = await res.json();
      if (result.data) setProgressId(result.data._id);
    } catch (e) { console.error(e); }
  }, [user, progressId, id, source, bookMeta]);

  const handleScroll = useCallback(() => {
    if (!contentRef.current || !autoSave) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const pct = Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
    if (pct !== progress && pct >= 0 && pct <= 100) {
      setProgress(pct);
    }
  }, [progress, autoSave]);

  const throttledSave = useRef(null);
  useEffect(() => {
    if (!autoSave || progress === 0) return;
    if (throttledSave.current) clearTimeout(throttledSave.current);
    throttledSave.current = setTimeout(() => {
      saveProgress({ progress: Math.max(progress, 1) });
    }, 2000);
    return () => { if (throttledSave.current) clearTimeout(throttledSave.current); };
  }, [progress, autoSave, saveProgress]);

  const addBookmark = async () => {
    const offset = contentRef.current?.scrollTop || 0;
    try {
      const res = await fetch(`${API}/api/books/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?._id, bookId: progressId, sourceId: id, source,
          label: `Page ${bookmarks.length + 1}`,
          offset,
        }),
      });
      const data = await res.json();
      if (data.data) setBookmarks(data.data.bookmarks || []);
    } catch (e) { console.error(e); }
  };

  const removeBookmark = async (bookmarkId) => {
    try {
      const res = await fetch(`${API}/api/books/bookmark`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?._id, bookId: progressId, bookmarkId }),
      });
      const data = await res.json();
      if (data.data) setBookmarks(data.data.bookmarks || []);
    } catch (e) { console.error(e); }
  };

  const goToBookmark = (offset) => {
    if (contentRef.current) {
      contentRef.current.scrollTop = offset;
    }
    setShowBookmarks(false);
  };

  const addHighlight = async () => {
    const sel = window.getSelection();
    const selectedText = sel?.toString()?.trim();
    if (!selectedText || !progressId) return;

    try {
      const res = await fetch(`${API}/api/books/highlight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?._id, bookId: progressId, sourceId: id, source,
          text: selectedText,
          offset: contentRef.current?.scrollTop || 0,
          color: '#ffeb3b',
        }),
      });
      const data = await res.json();
      if (data.data) setHighlights(data.data.highlights || []);
    } catch (e) { console.error(e); }
    setSelection('');
  };

  const removeHighlight = async (highlightId) => {
    try {
      const res = await fetch(`${API}/api/books/highlight`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?._id, bookId: progressId, highlightId }),
      });
      const data = await res.json();
      if (data.data) setHighlights(data.data.highlights || []);
    } catch (e) { console.error(e); }
  };

  const changeFontSize = (delta) => {
    setFontSize((prev) => Math.max(12, Math.min(36, prev + delta)));
  };

  const changeTheme = (t) => {
    setTheme(t);
    saveProgress({ theme: t });
  };

  const handleMouseUp = () => {
    const sel = window.getSelection();
    const txt = sel?.toString()?.trim();
    if (txt && txt.length > 0) {
      setSelection(txt);
    } else {
      setSelection('');
    }
  };

  const getThemeBg = () => {
    switch (theme) {
      case 'light': return '#f5f0e8';
      case 'dark': return '#0f0f13';
      case 'sepia': return '#f4ecd8';
      default: return '#f4ecd8';
    }
  };

  const getThemeColor = () => {
    switch (theme) {
      case 'light': return '#3a3a3a';
      case 'dark': return 'rgba(255,255,255,0.82)';
      case 'sepia': return '#5b4636';
      default: return '#5b4636';
    }
  };

  if (loading) {
    return (
      <div className="reader-container">
        <div className="loading-spinner" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
          <p>Loading book...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reader-container">
        <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span className="empty-icon">📖</span>
          <p>{error}</p>
          {externalReaderUrl && (
            <a href={externalReaderUrl} target="_blank" rel="noopener noreferrer" className="read-btn" style={{ textDecoration: 'none', marginTop: '1rem' }}>
              📖 Open in {externalReaderLabel}
            </a>
          )}
          <button className="search-btn" onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="reader-container">
      <div className="reader-toolbar">
        <div className="reader-toolbar-left">
          <button onClick={() => navigate(-1)}>← Back</button>
          {bookMeta && (
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {bookMeta.title}
            </span>
          )}
        </div>

        <div className="reader-toolbar-center">
          {source === 'gutenberg' && (
            <>
              <button onClick={() => changeFontSize(-2)}>A-</button>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', minWidth: '30px', textAlign: 'center' }}>{fontSize}px</span>
              <button onClick={() => changeFontSize(2)}>A+</button>

              <div className="reader-toolbar-divider" style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.08)', margin: '0 0.25rem' }} />

              <button className={theme === 'sepia' ? 'active' : ''} onClick={() => changeTheme('sepia')} style={{ background: theme === 'sepia' ? 'rgba(102,126,234,0.2)' : undefined }}>Sepia</button>
              <button className={theme === 'light' ? 'active' : ''} onClick={() => changeTheme('light')} style={{ background: theme === 'light' ? 'rgba(102,126,234,0.2)' : undefined }}>Light</button>
              <button className={theme === 'dark' ? 'active' : ''} onClick={() => changeTheme('dark')} style={{ background: theme === 'dark' ? 'rgba(102,126,234,0.2)' : undefined }}>Dark</button>

              <div className="reader-toolbar-divider" style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.08)', margin: '0 0.25rem' }} />
            </>
          )}
          {externalReaderUrl && (
            <a href={externalReaderUrl} target="_blank" rel="noopener noreferrer" className="read-btn" style={{ textDecoration: 'none', fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}>
              📖 Open in {externalReaderLabel}
            </a>
          )}
        </div>

        <div className="reader-toolbar-right">
          {source === 'gutenberg' && (
            <>
              <button className={showBookmarks ? 'active' : ''} onClick={() => { setShowBookmarks(!showBookmarks); setShowHighlights(false); }}>
                🔖 {bookmarks.length}
              </button>
              <button className={showHighlights ? 'active' : ''} onClick={() => { setShowHighlights(!showHighlights); setShowBookmarks(false); }}>
                🖍️ {highlights.length}
              </button>
              <button onClick={addBookmark}>+🔖</button>
            </>
          )}
        </div>
      </div>

      <div className="reader-progress-bar">
        <div className="progress-fill" style={{ width: `${source === 'gutenberg' ? Math.max(progress, 0.5) : 100}%` }} />
      </div>

      <div
        ref={contentRef}
        className={`reader-content ${theme}`}
        style={{ fontSize: `${fontSize}px` }}
        onScroll={source === 'gutenberg' ? handleScroll : undefined}
        onMouseUp={source === 'gutenberg' ? handleMouseUp : undefined}
      >
        {source === 'gutenberg' && selection && progressId && (
          <div style={{
            position: 'fixed', bottom: '3.5rem', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(15,15,19,0.95)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
            padding: '0.5rem 1rem', zIndex: 25, display: 'flex', gap: '0.5rem', alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              "{selection.substring(0, 50)}..."
            </span>
            <button onClick={addHighlight} style={{
              padding: '0.3rem 0.7rem', border: 'none', borderRadius: '6px',
              background: 'linear-gradient(135deg, var(--book-accent), var(--book-accent2))',
              color: 'white', fontFamily: 'inherit', fontSize: '0.75rem', cursor: 'pointer',
            }}>
              Highlight
            </button>
          </div>
        )}

        {source === 'gutenberg' ? (
          <div className="reader-text" style={{ background: getThemeBg(), color: getThemeColor() }}>
            {text}
          </div>
        ) : embeddable && externalReaderUrl ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <iframe
              src={externalReaderUrl}
              title="Book Preview"
              style={{ width: '100%', height: '90%', border: 'none', borderRadius: '12px' }}
              allowFullScreen
            />
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: '1rem', textAlign: 'center', padding: '2rem',
          }}>
            <span style={{ fontSize: '4rem', opacity: 0.3 }}>📖</span>
            <div className="reader-text" style={{ background: getThemeBg(), color: getThemeColor(), maxWidth: '600px', margin: '0 auto', fontSize: '1rem' }}>
              {text}
            </div>
            {externalReaderUrl && (
              <a href={externalReaderUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem',
                  padding: '0.7rem 1.6rem', border: 'none', borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--book-accent), var(--book-accent2))',
                  color: 'white', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600,
                  cursor: 'pointer', textDecoration: 'none',
                }}
              >
                📖 Read in {externalReaderLabel}
              </a>
            )}
          </div>
        )}
      </div>

      <div className="reader-footer">
        <span>{source === 'gutenberg' ? `${Math.max(progress, 0)}% complete` : `${bookMeta?.source || source} book`}</span>
        <span>{source === 'gutenberg' ? `${charCount.toLocaleString()} characters` : `${bookMeta?.author || ''}`}</span>
        {source === 'gutenberg' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} />
            Auto-save
          </label>
        )}
      </div>

      {source === 'gutenberg' && (
        <div className={`bookmarks-panel ${showBookmarks ? 'open' : ''}`}>
          <h3>🔖 Bookmarks ({bookmarks.length})</h3>
          {bookmarks.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>No bookmarks yet.</p>
          ) : (
            bookmarks.map((bm) => (
              <div key={bm._id} className="bookmark-item">
                <span onClick={() => goToBookmark(bm.offset)}>{bm.label}</span>
                <button onClick={() => removeBookmark(bm._id)}>✕</button>
              </div>
            ))
          )}
        </div>
      )}

      {source === 'gutenberg' && (
        <div className={`highlights-panel ${showHighlights ? 'open' : ''}`}>
          <h3>🖍️ Highlights ({highlights.length})</h3>
          {highlights.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>No highlights yet. Select text to highlight.</p>
          ) : (
            highlights.map((h) => (
              <div key={h._id} className="highlight-item" onClick={() => goToBookmark(h.offset || 0)}>
                <p>"{h.text}"</p>
                {h.note && <p className="highlight-note">{h.note}</p>}
                <div className="highlight-actions">
                  <button onClick={(e) => { e.stopPropagation(); removeHighlight(h._id); }}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default BookReader;
