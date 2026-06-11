import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL;

function MangaReader() {
  const { id, mangadexId, source: scanSource, mangaId: scanMangaId, chapterId: scanChapterId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const readerRef = useRef(null);

  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [useDataSaver, setUseDataSaver] = useState(false);
  const [viewMode, setViewMode] = useState('scroll');
  const [progress, setProgress] = useState(0);
  const [source, setSource] = useState(mangadexId ? 'mangadex' : (scanSource || 'jikan'));
  const [showSidebar, setShowSidebar] = useState(false);

  const mangaId = scanMangaId || mangadexId || id;
  const isMangaDex = !!mangadexId;
  const isScansSource = !!scanSource;

  useEffect(() => {
    const fetchMangaAndChapters = async () => {
      setLoading(true);
      try {
        if (isMangaDex) {
          const [mangaRes, chaptersRes] = await Promise.all([
            fetch(`${API}/api/mangadex/${mangaId}`),
            fetch(`${API}/api/mangadex/${mangaId}/chapters?limit=500`),
          ]);
          const mangaData = await mangaRes.json();
          const chaptersData = await chaptersRes.json();
          setManga(mangaData.data);
          const sorted = (chaptersData.data || []).sort((a, b) => (a.chapter || 0) - (b.chapter || 0));
          setChapters(sorted);
          if (sorted.length > 0) setCurrentChapter(sorted[sorted.length - 1]);
        } else if (isScansSource) {
          const apiMap = { comik: 'comik', comix: 'comix', coffeemanga: 'coffeemanga', asurascans: 'asurascans' };
          const apiPath = apiMap[scanSource] || scanSource;
          const slug = mangaId;
          const res = await fetch(`${API}/api/${apiPath}/${encodeURIComponent(slug)}`);
          const data = await res.json();
          if (data.data) {
            const m = data.data;
            setManga({
              title: m.title, imageUrl: m.imageUrl, source: scanSource,
              thumbnail: m.imageUrl,
            });
            const chs = (m.chapters || []).map((ch, i) => ({
              id: ch.url?.split('/').filter(Boolean).pop() || `ch-${i}`,
              number: ch.chapter || i + 1,
              title: ch.title || '',
            }));
            setChapters(chs);
            if (scanChapterId) {
              const found = chs.find((c) => c.id === scanChapterId);
              if (found) setCurrentChapter(found);
              else if (chs.length > 0) setCurrentChapter(chs[chs.length - 1]);
            } else if (chs.length > 0) {
              setCurrentChapter(chs[chs.length - 1]);
            }
          }
        } else {
          const res = await fetch(`${API}/api/manga/${mangaId}`);
          const data = await res.json();
          setManga(data.data);
          setChapters([]);
          setCurrentChapter(null);
        }
      } catch (e) {
        console.error('Failed to load manga:', e);
      }
      setLoading(false);
    };
    fetchMangaAndChapters();
  }, [mangaId, isMangaDex, isScansSource, scanSource, scanChapterId]);

  const fetchPages = useCallback(async (chapterId) => {
    if (!chapterId) return;
    setChapterLoading(true);
    try {
      if (isMangaDex) {
        const res = await fetch(`${API}/api/mangadex/chapter/${chapterId}/pages`);
        const data = await res.json();
        if (data.data) {
          setPages(useDataSaver ? data.data.pagesSd : data.data.pages);
        }
      } else if (isScansSource) {
        const apiMap = { comik: 'comik', comix: 'comix', coffeemanga: 'coffeemanga', asurascans: 'asurascans' };
        const apiPath = apiMap[scanSource] || scanSource;
        const res = await fetch(`${API}/api/${apiPath}/${encodeURIComponent(mangaId)}/chapter/${chapterId}`);
        const data = await res.json();
        if (data.data?.pages) setPages(data.data.pages);
      } else {
        const res = await fetch(`${API}/api/asurascans/${mangaId}/chapter/${chapterId}`);
        const data = await res.json();
        if (data.data?.pages) setPages(data.data.pages);
      }
    } catch (e) {
      console.error('Failed to fetch pages:', e);
    }
    setChapterLoading(false);
  }, [useDataSaver, mangaId, isMangaDex, isScansSource, scanSource]);

  useEffect(() => {
    if (currentChapter) {
      fetchPages(currentChapter.id);
      setProgress(0);
      if (readerRef.current) readerRef.current.scrollTop = 0;
    }
  }, [currentChapter, fetchPages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') changeChapter('prev');
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') changeChapter('next');
      else if (e.code === 'KeyS') setShowSidebar((p) => !p);
      else if (e.code === 'KeyQ') setUseDataSaver((p) => !p);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChapter, chapters]);

  const handleScroll = useCallback(() => {
    if (!readerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = readerRef.current;
    const pct = scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0;
    setProgress(Math.min(100, Math.round(pct)));
  }, []);

  const changeChapter = (dir) => {
    const idx = chapters.findIndex((c) => c.id === currentChapter?.id);
    if (dir === 'next' && idx < chapters.length - 1) setCurrentChapter(chapters[idx + 1]);
    else if (dir === 'prev' && idx > 0) setCurrentChapter(chapters[idx - 1]);
  };

  const saveProgress = useCallback(async () => {
    if (!user || !manga || !currentChapter) return;
    try {
      await fetch(`${API}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id, itemType: 'manga',
          itemId: mangaId, title: manga.title || 'Manga',
          imageUrl: manga.thumbnail || manga.imageUrl || '',
          currentItem: currentChapter.chapter || currentChapter.number || 0,
          totalItems: chapters.length || 0,
          status: 'reading',
        }),
      });
    } catch {}
  }, [user, manga, currentChapter, mangaId, chapters]);

  useEffect(() => {
    if (currentChapter && progress > 10) {
      const timer = setTimeout(saveProgress, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentChapter?.id, progress, saveProgress]);

  const getChapterNumber = () => {
    if (!currentChapter) return '?';
    return currentChapter.chapter || currentChapter.number || '?';
  };

  const getChapterTitle = () => currentChapter?.title || '';

  const getMangaTitle = () => {
    if (!manga) return 'Loading...';
    if (typeof manga === 'object') {
      if (manga.title) {
        if (typeof manga.title === 'object') return manga.title.en || Object.values(manga.title)[0] || 'Manga';
        return manga.title;
      }
    }
    return 'Manga';
  };

  if (loading) {
    return (
      <div className="reader-layout">
        <div className="reader-loading">
          <div className="vp-spinner" />
          <p>Loading manga...</p>
        </div>
      </div>
    );
  }

  const currentIdx = chapters.findIndex((c) => c.id === currentChapter?.id);

  return (
    <div className="reader-layout">
      <header className="reader-header">
        <div className="reader-header-left">
          <button className="reader-btn reader-btn-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div className="reader-header-info">
            <span className="reader-manga-title">{getMangaTitle()}</span>
            <span className="reader-chapter-info">Ch. {getChapterNumber()}{getChapterTitle() ? ` - ${getChapterTitle()}` : ''}</span>
          </div>
        </div>
        <div className="reader-header-right">
          <span className="reader-progress-pct">{progress}%</span>
          <label className="reader-toggle">
            <input type="checkbox" checked={useDataSaver} onChange={() => setUseDataSaver((p) => !p)} />
            <span className="reader-toggle-label">SD</span>
          </label>
          <label className="reader-toggle">
            <input type="checkbox" checked={showSidebar} onChange={() => setShowSidebar((p) => !p)} />
            <span className="reader-toggle-label">📋</span>
          </label>
        </div>
      </header>

      <div className="reader-body">
        <div className="reader-nav reader-nav-left" onClick={() => changeChapter('prev')}>
          {currentIdx > 0 && <span className="reader-nav-arrow">‹</span>}
        </div>

        <div className="reader-main" ref={readerRef} onScroll={handleScroll}>
          {chapterLoading ? (
            <div className="reader-loading">
              <div className="vp-spinner" />
              <p>Loading chapter...</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="reader-empty">
              <span>📖</span>
              <p>No chapter pages available.</p>
              {!isMangaDex && (
                <p className="reader-empty-hint">Try the MangaDex source for this manga.</p>
              )}
            </div>
          ) : (
            <div className="reader-pages">
              {pages.map((page, i) => (
                <div key={i} className="reader-page-wrap">
                  <img
                    src={page.url || page}
                    alt={`Page ${i + 1}`}
                    className="reader-page"
                    loading="lazy"
                  />
                  <span className="reader-page-num">{i + 1} / {pages.length}</span>
                </div>
              ))}
              <div className="reader-nav-btns">
                <button className="reader-btn" disabled={currentIdx <= 0} onClick={() => changeChapter('prev')}>
                  ← Previous Chapter
                </button>
                <button className="reader-btn reader-btn-primary" disabled={currentIdx >= chapters.length - 1} onClick={() => changeChapter('next')}>
                  Next Chapter →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="reader-nav reader-nav-right" onClick={() => changeChapter('next')}>
          {currentIdx < chapters.length - 1 && <span className="reader-nav-arrow">›</span>}
        </div>
      </div>

      {showSidebar && chapters.length > 0 && (
        <div className="reader-chapter-sidebar">
          <div className="reader-chapter-sidebar-header">
            <h3>Chapters ({chapters.length})</h3>
            <button className="reader-btn" onClick={() => setShowSidebar(false)}>✕</button>
          </div>
          <div className="reader-chapter-list">
            {[...chapters].reverse().map((c) => (
              <button
                key={c.id}
                className={`reader-chapter-item ${c.id === currentChapter?.id ? 'active' : ''}`}
                onClick={() => setCurrentChapter(c)}
              >
                <span>Ch. {c.chapter || c.number || '?'}</span>
                {c.title && <span className="reader-chapter-item-title">{c.title}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MangaReader;
