import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL;

function BookReaderView({ bookId, source = 'gutenberg' }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [progress, setProgress] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!bookId) return;
    setLoading(true);
    fetch(`${API}/api/books/text/${bookId}`)
      .then((r) => r.json())
      .then((data) => {
        setText(data.text || data.content || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bookId]);

  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const p = scrollTop / (scrollHeight - clientHeight);
    setProgress(Math.min(1, Math.max(0, p)));
  }, []);

  const saveProgress = useCallback(async () => {
    try {
      await fetch(`${API}/api/books/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId, progress: Math.round(progress * 100),
          fontSize, theme,
        }),
      });
    } catch {}
  }, [bookId, progress, fontSize, theme]);

  useEffect(() => {
    const t = setTimeout(saveProgress, 2000);
    return () => clearTimeout(t);
  }, [saveProgress]);

  const highlightSearch = (content) => {
    if (!searchQuery) return content;
    const parts = content.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase()
        ? `<mark style="background:#7c4dff44;color:#fff;padding:0 2px;border-radius:2px">${part}</mark>`
        : part
    ).join('');
  };

  if (loading) return <div className="loading-spinner" style={{ margin: '4rem auto' }} />;

  const themes = {
    dark: { bg: '#0f0f13', color: '#e0e0e0' },
    light: { bg: '#f5f0eb', color: '#2d2d2d' },
    sepia: { bg: '#f4ecd8', color: '#5b4636' },
  };
  const currentTheme = themes[theme] || themes.dark;

  return (
    <div className="book-reader" style={{ background: currentTheme.bg, color: currentTheme.color }}>
      <div className="reader-toolbar">
        <div className="toolbar-left">
          <button className="pill-btn secondary" onClick={() => setFontSize((s) => Math.max(s - 2, 10))}>A-</button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0 0.5rem' }}>{fontSize}px</span>
          <button className="pill-btn secondary" onClick={() => setFontSize((s) => Math.min(s + 2, 36))}>A+</button>
        </div>
        <div className="toolbar-center">
          <input
            type="text"
            placeholder="Search in text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="reader-search-input"
          />
        </div>
        <div className="toolbar-right">
          {['dark', 'light', 'sepia'].map((t) => (
            <button
              key={t}
              className={`pill-btn ${theme === t ? 'primary' : 'secondary'}`}
              onClick={() => setTheme(t)}
            >{t}</button>
          ))}
          <span className="reader-progress">{Math.round(progress * 100)}%</span>
        </div>
      </div>

      <div className="book-text-content" ref={contentRef} onScroll={handleScroll}
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.8, maxWidth: '720px', margin: '0 auto', padding: '1.5rem' }}
      >
        {searchQuery
          ? <div dangerouslySetInnerHTML={{ __html: highlightSearch(text) }} />
          : text.split('\n').map((line, i) => <p key={i} style={{ marginBottom: '0.5rem' }}>{line}</p>)
        }
      </div>
    </div>
  );
}

export default BookReaderView;
