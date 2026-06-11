import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AnimeHub.css';

const API = process.env.REACT_APP_API_URL;

function normalizeAniListManga(media) {
  return {
    mal_id: media.id,
    title: media.title,
    title_english: media.titleEnglish,
    title_japanese: media.titleNative,
    synopsis: media.synopsis,
    score: media.score,
    chapters: media.chapters,
    volumes: media.volumes,
    status: media.status,
    popularity: media.popularity,
    rank: media.favourites,
    genres: (media.genres || []).map((g) => ({ mal_id: g, name: g })),
    authors: [],
    images: { jpg: { large_image_url: media.imageUrl, image_url: media.imageUrl } },
    source: 'anilist',
  };
}

function normalizeKitsuManga(media) {
  return {
    mal_id: media.id,
    title: media.title,
    synopsis: media.synopsis,
    score: media.score,
    chapters: media.chapters,
    volumes: media.volumes,
    status: media.status,
    popularity: media.popularity,
    genres: (media.genres || []).map((g) => ({ mal_id: g, name: g })),
    authors: [],
    images: { jpg: { large_image_url: media.imageUrl, image_url: media.imageUrl } },
    source: 'kitsu',
  };
}

function MangaDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || 'jikan';
  const navigate = useNavigate();
  const { user } = useAuth();
  const [manga, setManga] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [inWatchList, setInWatchList] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetchAll = async () => {
      try {
        if (source === 'anilist') {
          const res = await fetch(`${API}/api/anilist/media/${id}`);
          const data = await res.json();
          if (data.data) {
            setManga(normalizeAniListManga(data.data));
            setCharacters((data.data.characters || []).slice(0, 20));
            setRecommendations((data.data.recommendations || []).slice(0, 20));
          }
        } else if (source === 'kitsu') {
          const res = await fetch(`${API}/api/kitsu/manga/${id}`);
          const data = await res.json();
          if (data.data) setManga(normalizeKitsuManga(data.data));
        } else if (source === 'asurascans') {
          const res = await fetch(`${API}/api/asurascans/${id}`);
          const data = await res.json();
          if (data.data) {
            const m = data.data;
            setManga({
              mal_id: id,
              title: m.title,
              title_english: '',
              title_japanese: '',
              synopsis: m.description,
              score: null,
              chapters: m.chapters?.length,
              volumes: null,
              status: m.status,
              genres: (m.genres || []).map((g) => ({ mal_id: g, name: g })),
              authors: [{ name: m.author }],
              images: { jpg: { large_image_url: m.imageUrl, image_url: m.imageUrl } },
              source: 'asurascans',
            });
            setChapters((m.chapters || []).map((ch, i) => ({
              id: ch.url?.split('/').filter(Boolean).pop() || `ch-${i}`,
              number: ch.chapter || i + 1,
              title: ch.title || '',
            })));
          }
        } else if (source === 'comik') {
          const res = await fetch(`${API}/api/comik/${id}`);
          const data = await res.json();
          if (data.data) {
            const m = data.data;
            setManga({
              mal_id: id,
              title: m.title,
              title_english: '',
              title_japanese: '',
              synopsis: m.description,
              score: null,
              chapters: m.chapters?.length,
              volumes: null,
              status: m.status,
              genres: (m.genres || []).map((g) => ({ mal_id: g, name: g })),
              authors: [{ name: m.author }],
              images: { jpg: { large_image_url: m.imageUrl, image_url: m.imageUrl } },
              source: 'comik',
            });
            setChapters((m.chapters || []).map((ch, i) => ({
              id: ch.url?.split('/').filter(Boolean).pop() || `ch-${i}`,
              number: ch.chapter || i + 1,
              title: ch.title || '',
            })));
          }
        } else if (source === 'comix') {
          const res = await fetch(`${API}/api/comix/${id}`);
          const data = await res.json();
          if (data.data) {
            const m = data.data;
            setManga({
              mal_id: id,
              title: m.title,
              title_english: '',
              title_japanese: '',
              synopsis: m.description,
              score: null,
              chapters: m.chapters?.length,
              volumes: null,
              status: m.status,
              genres: (m.genres || []).map((g) => ({ mal_id: g, name: g })),
              authors: [{ name: m.author }],
              images: { jpg: { large_image_url: m.imageUrl, image_url: m.imageUrl } },
              source: 'comix',
            });
            setChapters((m.chapters || []).map((ch, i) => ({
              id: ch.url?.split('/').filter(Boolean).pop() || `ch-${i}`,
              number: ch.chapter || i + 1,
              title: ch.title || '',
            })));
          }
        } else if (source === 'coffeemanga') {
          const res = await fetch(`${API}/api/coffeemanga/${id}`);
          const data = await res.json();
          if (data.data) {
            const m = data.data;
            setManga({
              mal_id: id,
              title: m.title,
              title_english: '',
              title_japanese: '',
              synopsis: m.description,
              score: null,
              chapters: m.chapters?.length,
              volumes: null,
              status: m.status,
              genres: (m.genres || []).map((g) => ({ mal_id: g, name: g })),
              authors: [{ name: m.author }],
              images: { jpg: { large_image_url: m.imageUrl, image_url: m.imageUrl } },
              source: 'coffeemanga',
            });
            setChapters((m.chapters || []).map((ch, i) => ({
              id: ch.url?.split('/').filter(Boolean).pop() || `ch-${i}`,
              number: ch.chapter || i + 1,
              title: ch.title || '',
            })));
          }
        } else {
          const [mangaRes, charRes, recRes] = await Promise.all([
            fetch(`${API}/api/manga/${id}`),
            fetch(`${API}/api/manga/${id}/characters`),
            fetch(`${API}/api/manga/${id}/recommendations`),
          ]);
          const [mangaData, charData, recData] = await Promise.all([
            mangaRes.json(), charRes.json(), recRes.json(),
          ]);
          setManga(mangaData.data);
          setCharacters((charData.data || []).slice(0, 20));
          setRecommendations((recData.data || []).slice(0, 20));
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchAll();
  }, [id, source]);

  useEffect(() => {
    if (!user || !id) return;
    fetch(`${API}/api/favorites/check?userId=${user._id}&itemType=manga&itemId=${id}`)
      .then((r) => r.json())
      .then((data) => setIsFav(data.isFavorite))
      .catch((e) => console.error('Fav check failed:', e));
    fetch(`${API}/api/watchlist/check?userId=${user._id}&itemType=manga&itemId=${id}`)
      .then((r) => r.json())
      .then((data) => setInWatchList(data.inList))
      .catch((e) => console.error('Watchlist check failed:', e));
  }, [user, id]);

  const toggleFav = async () => {
    if (!user || !manga) return;
    try {
      if (isFav) {
        await fetch(`${API}/api/favorites`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user._id, itemType: 'manga', itemId: manga.mal_id }) });
        setIsFav(false);
      } else {
        await fetch(`${API}/api/favorites`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user._id, itemType: 'manga', itemId: manga.mal_id, title: manga.title, imageUrl: manga.images?.jpg?.image_url, score: manga.score, type: manga.type, genres: manga.genres?.map((g) => g.name) }) });
        setIsFav(true);
      }
    } catch (e) { }
  };

  const toggleWatchList = async () => {
    if (!user || !manga) return;
    try {
      if (inWatchList) {
        await fetch(`${API}/api/watchlist?userId=${user._id}&itemType=manga&itemId=${manga.mal_id}`, { method: 'DELETE' });
        setInWatchList(false);
      } else {
        await fetch(`${API}/api/watchlist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user._id, itemType: 'manga', itemId: manga.mal_id, title: manga.title, imageUrl: manga.images?.jpg?.image_url, score: manga.score, type: manga.type, genres: manga.genres?.map((g) => g.name), total: manga.chapters, status: 'reading' }) });
        setInWatchList(true);
      }
    } catch (e) { }
  };

  const handleChapterClick = (ch) => {
    const src = manga?.source || source;
    if (src === 'asurascans' || src === 'comix' || src === 'coffeemanga' || src === 'comik') {
      navigate(`/anime-hub/manga/reader/scans/${src}/${encodeURIComponent(id)}/${ch.id}`);
    } else if (src === 'mangadex') {
      navigate(`/anime-hub/manga/reader/mangadex/${ch.id}`);
    }
  };

  if (loading) {
    return (
      <div className="anime-hub">
        <main className="anime-content">
          <div className="loading-spinner"><div className="spinner" /><p>Loading manga details...</p></div>
        </main>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="anime-hub">
        <main className="anime-content">
          <div className="empty-state">
            <span className="empty-icon">❌</span>
            <p>Manga not found</p>
            <button className="search-btn" onClick={() => navigate('/anime-hub/manga')}>Back to Manga Hub</button>
          </div>
        </main>
      </div>
    );
  }

  const imgUrl = manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url;

  return (
    <div className="anime-hub">
      <main className="anime-content" style={{ maxHeight: 'none', paddingBottom: '5rem' }}>
        <header className="anime-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="sidebar-nav-btn" onClick={() => navigate('/anime-hub/manga')} style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>← Back</button>
            <h1 className="page-title" style={{ fontSize: '1.2rem' }}>Manga Detail</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="search-btn" onClick={toggleFav} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: isFav ? undefined : 'rgba(255,255,255,0.06)', color: isFav ? undefined : 'rgba(255,255,255,0.6)' }}>
              {isFav ? '❤️ Favorited' : '🤍 Favorite'}
            </button>
            <button className="search-btn" onClick={toggleWatchList} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: inWatchList ? 'linear-gradient(135deg, #43e97b, #ffa751)' : 'rgba(255,255,255,0.06)', color: inWatchList ? undefined : 'rgba(255,255,255,0.6)' }}>
              {inWatchList ? '✅ Reading' : '➕ Read'}
            </button>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {imgUrl && (
            <div style={{ flexShrink: 0, width: '250px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <img src={imgUrl} alt={manga.title} style={{ width: '100%', display: 'block' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>{manga.title}</h1>
            {manga.title_japanese && <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem' }}>{manga.title_japanese}</div>}
            {manga.title_english && manga.title_english !== manga.title && <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }}>{manga.title_english}</div>}
            <div style={{ fontSize: '1.2rem', color: '#ffd700', marginBottom: '0.75rem' }}>
              {manga.score ? `⭐ ${manga.score}/10` : 'No rating'}
              {manga.scored_by ? <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem' }}>({manga.scored_by.toLocaleString()} users)</span> : ''}
            </div>
            <div className="card-meta" style={{ marginBottom: '1rem' }}>
              {manga.type && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>{manga.type}</span>}
              {manga.status && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>{manga.status}</span>}
              {manga.chapters && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>{manga.chapters} ch</span>}
              {manga.volumes && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>{manga.volumes} vol</span>}
              {manga.rank && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>#{manga.rank} Ranked</span>}
              {manga.popularity && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>#{manga.popularity} Popular</span>}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: '1rem' }}>{manga.synopsis || 'No synopsis available.'}</p>
            {manga.genres?.length > 0 && (
              <div className="card-genres" style={{ marginBottom: '0.75rem' }}>
                {manga.genres.map((g) => (<span key={g.mal_id} className="genre-tag" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>{g.name}</span>))}
              </div>
            )}
            {manga.authors?.length > 0 && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>Authors: {manga.authors.map((a) => a.name).join(', ')}</div>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <a href={`https://mangadex.org/search?q=${encodeURIComponent(manga.title)}`} target="_blank" rel="noopener noreferrer" className="search-btn" style={{ background: 'linear-gradient(135deg, #ff6f00, #ffa726)', padding: '0.4rem 1rem', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                📖 Read on MangaDex
              </a>
              <a href={`https://mangabuddy.com/search?q=${encodeURIComponent(manga.title)}`} target="_blank" rel="noopener noreferrer" className="search-btn" style={{ background: 'linear-gradient(135deg, #7c4dff, #b388ff)', padding: '0.4rem 1rem', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                📖 Read on MangaBuddy
              </a>
            </div>
          </div>
        </div>

        {chapters.length > 0 && ['asurascans', 'comik', 'comix', 'coffeemanga'].includes(manga?.source) && (
          <div className="glass" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.75rem', fontSize: '1rem' }}>📖 Chapters ({chapters.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '500px', overflowY: 'auto' }}>
              {[...chapters].reverse().map((ch, i) => (
                <div key={ch.id || i} className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', cursor: 'pointer', margin: 0, borderRadius: '8px' }}
                  onClick={() => handleChapterClick(ch)}>
                  <div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Ch. {ch.number}</span>
                    {ch.title && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{ch.title}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="detail-sections">
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 1rem', fontSize: '1rem' }}>👥 Characters</h3>
          {characters.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>No character data available.</p>
          ) : (
            <div className="anime-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
              {characters.map((c) => (
                <div key={c.character?.mal_id} className="anime-card glass" style={{ cursor: 'default' }}>
                  <div className="card-image" style={{ paddingTop: '100%' }}>
                    <img src={c.character?.images?.jpg?.image_url || 'https://via.placeholder.com/140'} alt={c.character?.name} />
                  </div>
                  <div className="card-body" style={{ textAlign: 'center' }}>
                    <div className="card-title" style={{ fontSize: '0.8rem' }}>{c.character?.name}</div>
                    <span className="badge" style={{ fontSize: '0.65rem' }}>{c.role}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ color: 'var(--text-primary)', margin: '2rem 0 1rem', fontSize: '1rem' }}>📌 Recommendations</h3>
          {recommendations.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>No recommendations available.</p>
          ) : (
            <div className="anime-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                  {recommendations.map((rec, i) => {
                    const entry = rec.entry || rec;
                    const recId = entry.mal_id || entry.id || entry.malId;
                    return entry ? (
                      <div key={i} className="anime-card glass" onClick={() => navigate(`/anime-hub/manga/${recId}?source=${entry.source || 'jikan'}`)}>
                    <div className="card-image" style={{ paddingTop: '140%' }}>
                      <img src={entry.images?.jpg?.image_url || 'https://via.placeholder.com/160x220'} alt={entry.title} />
                    </div>
                    <div className="card-body">
                      <div className="card-title" style={{ fontSize: '0.78rem' }}>{entry.title}</div>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default MangaDetail;
