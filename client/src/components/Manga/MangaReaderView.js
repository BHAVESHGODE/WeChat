import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL;

function MangaReaderView({ mangaId, source = 'mangadex', chapterId }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [scale, setScale] = useState(1);
  const [translation, setTranslation] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!chapterId) return;
    setLoading(true);
    const endpoint = source === 'mangadex'
      ? `${API}/api/mangadex/chapter/${chapterId}/pages`
      : `${API}/api/${source}/${mangaId}/chapter/${chapterId}`;

    fetch(endpoint)
      .then((r) => r.json())
      .then((data) => {
        setPages(data.pages || data.images || data || []);
        setCurrentPage(0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mangaId, chapterId, source]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const pct = scrollTop / (scrollHeight - clientHeight);
    const idx = Math.round(pct * (pages.length - 1));
    setCurrentPage(Math.max(0, Math.min(idx, pages.length - 1)));
  }, [pages]);

  if (loading) return <div className="loading-spinner" style={{ margin: '4rem auto' }} />;
  if (!pages.length) return <div className="empty-state"><p>No pages found</p></div>;

  return (
    <div className="manga-reader">
      <div className="reader-controls">
        <div className="reader-controls-left">
          <span>Page {currentPage + 1} / {pages.length}</span>
        </div>
        <div className="reader-controls-right">
          <button className="pill-btn secondary" onClick={() => setScale((s) => Math.min(s + 0.25, 3))}>Zoom +</button>
          <button className="pill-btn secondary" onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}>Zoom -</button>
          <label className="toggle-label">
            <input type="checkbox" checked={translation} onChange={() => setTranslation(!translation)} />
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            <span className="toggle-text">TL</span>
          </label>
        </div>
      </div>

      <div className="reader-pages" ref={containerRef} onScroll={handleScroll}>
        {pages.map((page, i) => (
          <div key={i} className="reader-page-wrap">
            <img
              src={page.url || page.image || page}
              alt={`Page ${i + 1}`}
              style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default MangaReaderView;
