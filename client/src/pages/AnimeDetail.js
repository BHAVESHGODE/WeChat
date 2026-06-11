import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AnimeHub.css';

const API = process.env.REACT_APP_API_URL;

function normalizeAniList(media) {
  const mapped = {
    mal_id: media.id,
    malId: media.id,
    title: media.title,
    title_english: media.titleEnglish,
    title_japanese: media.titleNative,
    synopsis: media.synopsis,
    score: media.score,
    scored_by: media.popularity,
    episodes: media.episodes,
    duration: media.duration,
    status: media.status,
    season: media.season?.toLowerCase(),
    year: media.year,
    rank: media.favourites,
    popularity: media.popularity,
    type: 'ANIME',
    genres: (media.genres || []).map((g) => ({ mal_id: g, name: g })),
    studios: media.studios || [],
    images: { jpg: { large_image_url: media.imageUrl, image_url: media.imageUrl } },
    trailer: null,
    source: 'anilist',
  };
  return { data: mapped, characters: media.characters || [], recommendations: media.recommendations || [] };
}

function normalizeKitsu(media) {
  return {
    mal_id: media.id,
    malId: media.id,
    title: media.title,
    title_english: media.titles?.en || '',
    title_japanese: media.titles?.ja_jp || '',
    synopsis: media.synopsis,
    score: media.score,
    episodes: media.episodes,
    duration: media.episodeLength,
    status: media.status,
    genres: (media.genres || []).map((g) => ({ mal_id: g, name: g })),
    images: { jpg: { large_image_url: media.imageUrl, image_url: media.imageUrl } },
    source: 'kitsu',
  };
}

function AnimeDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || 'jikan';
  const navigate = useNavigate();
  const { user } = useAuth();
  const [anime, setAnime] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('characters');
  const [isFav, setIsFav] = useState(false);
  const [inWatchList, setInWatchList] = useState(false);
  const [streamingLinks, setStreamingLinks] = useState([]);

  useEffect(() => {
    setLoading(true);
    const fetchAll = async () => {
      try {
        if (source === 'anilist') {
          const res = await fetch(`${API}/api/anilist/media/${id}`);
          const data = await res.json();
          if (data.data) {
            const n = normalizeAniList(data.data);
            setAnime(n.data);
            setCharacters((n.data.characters || data.data.characters || []).slice(0, 20));
            setRecommendations((n.data.recommendations || data.data.recommendations || []).slice(0, 20));
          }
        } else if (source === 'kitsu') {
          const res = await fetch(`${API}/api/kitsu/anime/${id}`);
          const data = await res.json();
          if (data.data) setAnime(normalizeKitsu(data.data));
        } else {
          const [animeRes, charRes, revRes, recRes] = await Promise.all([
            fetch(`${API}/api/anime/${id}`),
            fetch(`${API}/api/anime/${id}/characters`),
            fetch(`${API}/api/anime/${id}/reviews`),
            fetch(`${API}/api/anime/${id}/recommendations`),
          ]);
          const [animeData, charData, revData, recData] = await Promise.all([
            animeRes.json(), charRes.json(), revRes.json(), recRes.json(),
          ]);
          setAnime(animeData.data);
          setCharacters((charData.data || []).slice(0, 20));
          setReviews((revData.data || []).slice(0, 10));
          setRecommendations((recData.data || []).slice(0, 20));
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchAll();
  }, [id, source]);

  useEffect(() => {
    if (!user || !id) return;
    fetch(`${API}/api/favorites/check?userId=${user._id}&itemType=anime&itemId=${id}`)
      .then((r) => r.json())
      .then((data) => setIsFav(data.isFavorite))
      .catch((e) => console.error('Fav check failed:', e));
    fetch(`${API}/api/watchlist/check?userId=${user._id}&itemType=anime&itemId=${id}`)
      .then((r) => r.json())
      .then((data) => setInWatchList(data.inList))
      .catch((e) => console.error('Watchlist check failed:', e));
  }, [user, id]);

  useEffect(() => {
    if (!anime) return;
    fetch(`${API}/api/streaming/links?title=${encodeURIComponent(anime.title)}`)
      .then((r) => r.json())
      .then((data) => setStreamingLinks(data.data || []))
      .catch((e) => console.error('Streaming links failed:', e));
  }, [anime]);

  const toggleFav = async () => {
    if (!user || !anime) return;
    try {
      if (isFav) {
        await fetch(`${API}/api/favorites`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user._id, itemType: 'anime', itemId: anime.mal_id }) });
        setIsFav(false);
      } else {
        await fetch(`${API}/api/favorites`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user._id, itemType: 'anime', itemId: anime.mal_id, title: anime.title, imageUrl: anime.images?.jpg?.image_url, score: anime.score, type: anime.type, genres: anime.genres?.map((g) => g.name) }) });
        setIsFav(true);
      }
    } catch (e) { }
  };

  const toggleWatchList = async () => {
    if (!user || !anime) return;
    try {
      if (inWatchList) {
        await fetch(`${API}/api/watchlist?userId=${user._id}&itemType=anime&itemId=${anime.mal_id}`, { method: 'DELETE' });
        setInWatchList(false);
      } else {
        await fetch(`${API}/api/watchlist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user._id, itemType: 'anime', itemId: anime.mal_id, title: anime.title, imageUrl: anime.images?.jpg?.image_url, score: anime.score, type: anime.type, genres: anime.genres?.map((g) => g.name), total: anime.episodes, status: 'watching' }) });
        setInWatchList(true);
      }
    } catch (e) { }
  };

  if (loading) {
    return (
      <div className="anime-hub">
        <main className="anime-content">
          <div className="loading-spinner"><div className="spinner" /><p>Loading anime details...</p></div>
        </main>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="anime-hub">
        <main className="anime-content">
          <div className="empty-state">
            <span className="empty-icon">❌</span>
            <p>Anime not found</p>
            <button className="search-btn" onClick={() => navigate('/anime-hub')}>Back to Anime Hub</button>
          </div>
        </main>
      </div>
    );
  }

  const imgUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;

  return (
    <div className="anime-hub">
      <main className="anime-content" style={{ maxHeight: 'none', paddingBottom: '5rem' }}>
        <header className="anime-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="sidebar-nav-btn" onClick={() => navigate('/anime-hub')} style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>← Back</button>
            <h1 className="page-title" style={{ fontSize: '1.2rem' }}>Anime Detail</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className={`search-btn ${isFav ? 'fav-active' : ''}`} onClick={toggleFav} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
              {isFav ? '❤️ Favorited' : '🤍 Favorite'}
            </button>
            <button className={`search-btn ${inWatchList ? 'fav-active' : ''}`} onClick={toggleWatchList} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: inWatchList ? 'linear-gradient(135deg, #43e97b, #ffa751)' : undefined }}>
              {inWatchList ? '✅ Watching' : '➕ Watch'}
            </button>
          </div>
        </header>

        <div className="detail-hero" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {imgUrl && (
            <div style={{ flexShrink: 0, width: '280px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <img src={imgUrl} alt={anime.title} style={{ width: '100%', display: 'block' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>{anime.title}</h1>
            {anime.title_japanese && <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem' }}>{anime.title_japanese}</div>}
            {anime.title_english && anime.title_english !== anime.title && <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }}>{anime.title_english}</div>}
            <div style={{ fontSize: '1.2rem', color: '#ffd700', marginBottom: '0.75rem' }}>
              {anime.score ? `⭐ ${anime.score}/10` : 'No rating'}
              {anime.scored_by ? <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem' }}>({anime.scored_by.toLocaleString()} users)</span> : ''}
            </div>
            <div className="card-meta" style={{ marginBottom: '1rem' }}>
              {anime.type && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>{anime.type}</span>}
              {anime.status && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>{anime.status}</span>}
              {anime.episodes && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>{anime.episodes} eps</span>}
              {anime.duration && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>{anime.duration}</span>}
              {anime.rating && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>{anime.rating}</span>}
              {anime.season && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>{anime.season} {anime.year}</span>}
              {anime.rank && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>#{anime.rank} Ranked</span>}
              {anime.popularity && <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>#{anime.popularity} Popular</span>}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: '1rem' }}>{anime.synopsis || 'No synopsis available.'}</p>
            {anime.genres?.length > 0 && (
              <div className="card-genres" style={{ marginBottom: '0.75rem' }}>
                {anime.genres.map((g) => (<span key={g.mal_id} className="genre-tag" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>{g.name}</span>))}
              </div>
            )}
            {anime.studios?.length > 0 && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>Studios: {anime.studios.map((s) => s.name).join(', ')}</div>}
            {anime.trailer?.url && (
              <a href={anime.trailer.url} target="_blank" rel="noopener noreferrer" className="search-btn" style={{ display: 'inline-flex', textDecoration: 'none', marginTop: '0.5rem' }}>▶ Watch Trailer</a>
            )}
          </div>
        </div>

        <div className="glass" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.75rem', fontSize: '1rem' }}>🌐 Watch Online Free</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <a href={`https://hianime.to/search?keyword=${encodeURIComponent(anime.title)}`} target="_blank" rel="noopener noreferrer" className="search-btn" style={{ background: 'linear-gradient(135deg, #7c4dff, #b388ff)', padding: '0.4rem 1rem', fontSize: '0.8rem', textDecoration: 'none' }}>
              ▶ Watch on HiAnime
            </a>
            <a href={`https://aniwave.to/search?keyword=${encodeURIComponent(anime.title)}`} target="_blank" rel="noopener noreferrer" className="search-btn" style={{ background: 'linear-gradient(135deg, #ff6f00, #ffa726)', padding: '0.4rem 1rem', fontSize: '0.8rem', textDecoration: 'none' }}>
              ▶ Watch on Aniwave
            </a>
            {streamingLinks.length > 0 && streamingLinks.map((link) => (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="search-btn" style={{ background: link.color, padding: '0.4rem 1rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                ▶ {link.name}
              </a>
            ))}
          </div>
        </div>

        <div className="detail-sections">
          <div className="search-filters" style={{ marginBottom: '1.5rem', gap: '0.5rem' }}>
            <button className={`search-btn ${activeSection === 'characters' ? '' : ''}`} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: activeSection === 'characters' ? undefined : 'rgba(255,255,255,0.06)', color: activeSection === 'characters' ? undefined : 'rgba(255,255,255,0.6)' }} onClick={() => setActiveSection('characters')}>
              Characters ({characters.length})
            </button>
            <button className={`search-btn ${activeSection === 'reviews' ? '' : ''}`} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: activeSection === 'reviews' ? undefined : 'rgba(255,255,255,0.06)', color: activeSection === 'reviews' ? undefined : 'rgba(255,255,255,0.6)' }} onClick={() => setActiveSection('reviews')}>
              Reviews ({reviews.length})
            </button>
            <button className={`search-btn ${activeSection === 'recommendations' ? '' : ''}`} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: activeSection === 'recommendations' ? undefined : 'rgba(255,255,255,0.06)', color: activeSection === 'recommendations' ? undefined : 'rgba(255,255,255,0.6)' }} onClick={() => setActiveSection('recommendations')}>
              Recommendations ({recommendations.length})
            </button>
          </div>

          {activeSection === 'characters' && (
            <>
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
            </>
          )}

          {activeSection === 'reviews' && (
            <>
              {reviews.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>No reviews yet.</p>
              ) : (
                reviews.map((r, i) => (
                  <div key={i} className="glass" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(124,77,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--anime-accent2)', fontWeight: 700, fontSize: '0.9rem' }}>
                        {r.user?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>{r.user?.username || 'Anonymous'}</div>
                        {r.tags && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>{r.tags.join(' · ')}</div>}
                      </div>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{r.review?.substring(0, 500)}{r.review?.length > 500 ? '...' : ''}</p>
                  </div>
                ))
              )}
            </>
          )}

          {activeSection === 'recommendations' && (
            <>
              {recommendations.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>No recommendations available.</p>
              ) : (
                <div className="anime-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                  {recommendations.map((rec, i) => {
                    const entry = rec.entry || rec;
                    const recId = entry.mal_id || entry.id || entry.malId;
                    return entry ? (
                      <div key={i} className="anime-card glass" onClick={() => navigate(`/anime/${recId}?source=${entry.source || 'jikan'}`)}>
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
            </>
          )}
        </div>

      </main>
    </div>
  );
}

export default AnimeDetail;
