import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMusic } from '../context/MusicContext';
import AmbientSounds from './AmbientSounds';

const API = process.env.REACT_APP_API_URL;

const QUALITIES = [
  { label: 'Audio Only', value: 'audio', format: 'bestaudio[ext=m4a]/bestaudio' },
  { label: '144p', value: '144p', format: 'worst[height<=144]' },
  { label: '360p', value: '360p', format: 'best[height<=360]' },
  { label: '720p', value: '720p', format: 'best[height<=720]' },
  { label: '1080p', value: '1080p', format: 'best[height<=1080]' },
  { label: '4K', value: '4k', format: 'best[height<=2160]' },
];

function AdFreeYouTube() {
  const { play, currentTrack, isPlaying, addToQueue, queue, queueIndex, pause, resume, playFromQueue, removeFromQueue, progress, seekTo, volume, setVolume, shuffle, repeat, toggleShuffle, toggleRepeat } = useMusic();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('trending');
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [related, setRelated] = useState([]);
  const [audioOnly, setAudioOnly] = useState(false);
  const [quality, setQuality] = useState('audio');
  const [showAmbient, setShowAmbient] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [downloading, setDownloading] = useState({});
  const [favMsg, setFavMsg] = useState('');
  const [expandedPlayer, setExpandedPlayer] = useState(false);
  const visualizerRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => { fetchTrending(); fetchFavorites(); }, []);

  useEffect(() => {
    if (!currentTrack || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let stopped = false;

    const draw = () => {
      if (stopped) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 64;
      const w = canvas.width / bars;
      for (let i = 0; i < bars; i++) {
        const h = (Math.sin(i * 0.3 + Date.now() * 0.002) * 0.4 + 0.6) * canvas.height * (0.3 + Math.random() * 0.7);
        const x = i * w;
        const gradient = ctx.createLinearGradient(x, canvas.height, x, canvas.height - h);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.5, '#ff6b6b');
        gradient.addColorStop(1, '#ffd93d');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - h, w - 2, h, [2, 2, 0, 0]);
        ctx.fill();
      }
      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { stopped = true; if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [currentTrack, isPlaying]);

  const fetchTrending = async () => {
    setError('');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API}/api/adyoutube/trending?limit=20`, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.tracks) { setTrending(data.tracks); setLoading(false); return; }
    } catch {}
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${API}/api/adyoutube/search?q=trending+music+2025&limit=12`, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.tracks) { setTrending(data.tracks); setLoading(false); return; }
    } catch {}
    setLoading(false);
  };

  const fetchFavorites = async () => {
    try {
      const res = await fetch(`${API}/api/adyoutube/favorites`);
      const data = await res.json();
      if (data.tracks) setFavorites(data.tracks);
    } catch {}
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/adyoutube/search?q=${encodeURIComponent(query)}&limit=24`);
      const data = await res.json();
      if (data.tracks) setResults(data.tracks);
      setActiveTab('search');
    } catch { setError('Search failed. Try again.'); }
    setLoading(false);
  };

  const fetchRelated = async (videoId) => {
    try {
      const res = await fetch(`${API}/api/adyoutube/related?videoId=${videoId}&limit=12`);
      const data = await res.json();
      if (data.tracks) setRelated(data.tracks);
    } catch {}
  };

  const getStreamUrl = async (videoId, fmt) => {
    try {
      const res = await fetch(`${API}/api/adyoutube/stream?videoId=${videoId}&format=${encodeURIComponent(fmt || 'bestaudio[ext=m4a]/bestaudio')}`);
      const data = await res.json();
      return data.streamUrl || null;
    } catch { return null; }
  };

  const handlePlayTrack = useCallback(async (track) => {
    setSelectedVideoId(track.videoId);
    const list = activeTab === 'trending' ? trending : activeTab === 'favorites' ? favorites : results;
    const idx = list.findIndex((t) => t.videoId === track.videoId);
    const fmt = audioOnly ? 'bestaudio[ext=m4a]/bestaudio' : QUALITIES.find((q) => q.value === quality)?.format || 'bestaudio[ext=m4a]/bestaudio';
    try {
      const res = await fetch(`${API}/api/adyoutube/stream?videoId=${track.videoId}&format=${encodeURIComponent(fmt)}`);
      const data = await res.json();
      if (data.streamUrl) {
        const adfreeTrack = { ...track, source: 'adyoutube', playableLink: data.streamUrl, videoId: track.videoId };
        play(adfreeTrack, idx >= 0 ? idx : 0, list.length > 0 ? list : [adfreeTrack]);
        fetchRelated(track.videoId);
      } else {
        play({ ...track, source: 'youtube', videoId: track.videoId }, idx >= 0 ? idx : 0, list.length > 0 ? list : [{ ...track, source: 'youtube' }]);
        fetchRelated(track.videoId);
      }
    } catch {
      play({ ...track, source: 'youtube', videoId: track.videoId }, idx >= 0 ? idx : 0, list.length > 0 ? list : [{ ...track, source: 'youtube' }]);
      fetchRelated(track.videoId);
    }
  }, [play, audioOnly, quality, activeTab, trending, results, favorites]);

  const handleAddToQueue = (track) => {
    addToQueue({ ...track, source: 'adyoutube' });
  };

  const handleDownload = async (track) => {
    setDownloading((d) => ({ ...d, [track.videoId]: true }));
    try {
      await fetch(`${API}/api/adyoutube/cache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: track.videoId, title: track.title, artist: track.artist,
          thumbnail: track.thumbnail, duration: track.duration,
          format: audioOnly ? 'audio' : 'video', quality: quality,
        }),
      });
    } catch {}
    setDownloading((d) => ({ ...d, [track.videoId]: false }));
  };

  const handleFavorite = async (track) => {
    try {
      const res = await fetch(`${API}/api/adyoutube/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: track.videoId, title: track.title, artist: track.artist,
          thumbnail: track.thumbnail, duration: track.duration, views: track.views, channelId: track.channelId,
        }),
      });
      const data = await res.json();
      setFavMsg(data.message || 'Saved!');
      fetchFavorites();
    } catch { setFavMsg('Failed to save'); }
    setTimeout(() => setFavMsg(''), 2000);
  };

  const isFavorited = (videoId) => favorites.some((f) => f.videoId === videoId);

  const fmtDuration = (s) => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const fmtViews = (n) => {
    if (!n) return '';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const trackList = activeTab === 'trending' ? trending : activeTab === 'favorites' ? favorites : results;

  const nowPlayingStyle = currentTrack?.thumbnail
    ? { backgroundImage: `url(${currentTrack.thumbnail})` }
    : {};

  return (
    <div className="yp-container">
      {/* Premium Header */}
      <div className="yp-header">
        <div className="yp-header-content">
          <div className="yp-brand">
            <span className="yp-brand-icon">▶</span>
            <h1 className="yp-title">Ad-Free YouTube</h1>
          </div>
          <p className="yp-subtitle">Premium • No Ads • High Quality • Background Play</p>
        </div>
        <div className="yp-header-actions">
          <button
            className={`yp-pill-btn ${showAmbient ? 'active' : ''}`}
            onClick={() => setShowAmbient(!showAmbient)}
            title="Ambient Mode"
          >
            🌿 Ambient
          </button>
          <button
            className={`yp-pill-btn ${showQueue ? 'active' : ''}`}
            onClick={() => setShowQueue(!showQueue)}
            title="Queue"
          >
            📋 Queue ({queue.length})
          </button>
        </div>
      </div>

      {/* Ambient Sounds Panel */}
      {showAmbient && (
        <div className="yp-ambient-panel">
          <AmbientSounds />
        </div>
      )}

      {/* Search Bar */}
      <div className="yp-search-wrap">
        <div className="yp-search">
          <span className="yp-search-icon">🔍</span>
          <input
            className="yp-search-input"
            type="text"
            placeholder="Search YouTube Music, artists, albums..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          {query && (
            <button className="yp-search-clear" onClick={() => { setQuery(''); setResults([]); }}>
              ✕
            </button>
          )}
          <button className="yp-search-btn" onClick={handleSearch} disabled={loading}>
            {loading ? <span className="yp-spinner" /> : 'Search'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="yp-tabs">
        <button
          className={`yp-tab ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => setActiveTab('trending')}
        >
          🔥 Trending
        </button>
        <button
          className={`yp-tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
          disabled={results.length === 0}
        >
          📺 Results {results.length > 0 && `(${results.length})`}
        </button>
        <button
          className={`yp-tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => { setActiveTab('favorites'); fetchFavorites(); }}
        >
          ❤️ Favorites {favorites.length > 0 && `(${favorites.length})`}
        </button>
      </div>

      {favMsg && <div className="yp-fav-msg">{favMsg}</div>}
      {error && <div className="yp-error">{error}</div>}

      {/* Content Grid */}
      {loading ? (
        <div className="yp-loading">
          <div className="yp-spinner-lg" />
          <p>Loading premium content...</p>
        </div>
      ) : (
        <>
          <div className="yp-grid">
            {trackList.map((track, i) => (
              <div
                key={track.videoId || i}
                className={`yp-card ${selectedVideoId === track.videoId ? 'active' : ''}`}
              >
                <div className="yp-card-img-wrap" onClick={() => handlePlayTrack(track)}>
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    className="yp-card-img"
                    loading="lazy"
                  />
                  <div className="yp-card-overlay">
                    <div className="yp-card-play-btn">
                      {selectedVideoId === track.videoId && isPlaying ? '⏸' : '▶'}
                    </div>
                  </div>
                  {track.duration > 0 && (
                    <span className="yp-card-dur">{fmtDuration(track.duration)}</span>
                  )}
                  {selectedVideoId === track.videoId && isPlaying && (
                    <div className="yp-card-playing-bar">
                      <div className="yp-card-playing-bar-inner" />
                    </div>
                  )}
                </div>
                <div className="yp-card-body">
                  <p className="yp-card-title" title={track.title}>{track.title}</p>
                  <p className="yp-card-artist">{track.artist}</p>
                  <div className="yp-card-meta">
                    {track.views > 0 && <span>{fmtViews(track.views)} views</span>}
                  </div>
                  <div className="yp-card-actions">
                    <button
                      className="yp-action-btn primary"
                      onClick={() => handlePlayTrack(track)}
                      title="Play"
                    >
                      {selectedVideoId === track.videoId && isPlaying ? '⏸' : '▶'} Play
                    </button>
                    <button
                      className="yp-action-btn"
                      onClick={() => handleAddToQueue(track)}
                      title="Add to Queue"
                    >
                      +Q
                    </button>
                    <button
                      className={`yp-action-btn ${isFavorited(track.videoId) ? 'faved' : ''}`}
                      onClick={() => handleFavorite(track)}
                      title={isFavorited(track.videoId) ? 'Favorited' : 'Add to Favorites'}
                    >
                      {isFavorited(track.videoId) ? '❤️' : '🤍'}
                    </button>
                    <button
                      className="yp-action-btn"
                      onClick={() => handleDownload(track)}
                      disabled={downloading[track.videoId]}
                      title="Download for offline"
                    >
                      {downloading[track.videoId] ? '⏳' : '⬇'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {trackList.length === 0 && activeTab !== 'trending' && (
            <div className="yp-empty">
              <span className="yp-empty-icon">🎵</span>
              <p>No results found. Try a different search!</p>
            </div>
          )}
        </>
      )}

      {/* Expanded Player Section */}
      {currentTrack && (
        <div className={`yp-now-playing ${expandedPlayer ? 'expanded' : ''}`}>
          <div className="yp-now-blur" style={nowPlayingStyle} />
          <div className="yp-now-inner">
            <div className="yp-now-visualizer">
              <canvas ref={canvasRef} width={400} height={80} className="yp-vis-canvas" />
            </div>
            <div className="yp-now-info">
              <div className="yp-now-thumb-wrap">
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="yp-now-thumb"
                />
              </div>
              <div className="yp-now-text">
                <p className="yp-now-title">{currentTrack.title}</p>
                <p className="yp-now-artist">{currentTrack.artist}</p>
              </div>
            </div>
            <div className="yp-now-controls-row">
              <span className="yp-time">{fmtDuration(progress.elapsed)}</span>
              <div
                className="yp-progress"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const p = (e.clientX - rect.left) / rect.width;
                  if (progress.duration > 0) seekTo(p * progress.duration);
                }}
              >
                <div className="yp-progress-fill" style={{ width: `${progress.duration > 0 ? (progress.elapsed / progress.duration) * 100 : 0}%` }} />
              </div>
              <span className="yp-time">{fmtDuration(progress.duration)}</span>
            </div>
            <div className="yp-now-settings">
              <label className="yp-toggle-label">
                <input type="checkbox" checked={audioOnly} onChange={() => setAudioOnly(!audioOnly)} />
                <span className="yp-toggle-track"><span className="yp-toggle-thumb" /></span>
                <span className="yp-toggle-text">Audio Only</span>
              </label>
              <select
                className="yp-quality-select"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              >
                {QUALITIES.map((q) => (
                  <option key={q.value} value={q.value}>{q.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Queue Panel */}
      {showQueue && queue.length > 0 && (
        <div className="yp-queue-panel">
          <div className="yp-queue-header">
            <h3>Up Next ({queue.length})</h3>
            <button className="yp-queue-close" onClick={() => setShowQueue(false)}>✕</button>
          </div>
          <div className="yp-queue-list">
            {queue.map((track, idx) => (
              <div
                key={idx}
                className={`yp-queue-item ${queueIndex === idx ? 'active' : ''}`}
                onClick={() => playFromQueue(idx, queue)}
              >
                <span className="yp-queue-idx">{idx + 1}</span>
                {track.thumbnail && <img src={track.thumbnail} alt="" className="yp-queue-thumb" />}
                <div className="yp-queue-info">
                  <p className="yp-queue-title">{track.title}</p>
                  <p className="yp-queue-artist">{track.artist}</p>
                </div>
                <button className="yp-queue-remove" onClick={(e) => { e.stopPropagation(); removeFromQueue(idx); }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Videos */}
      {selectedVideoId && related.length > 0 && (
        <div className="yp-related">
          <h3 className="yp-related-title">Recommended For You</h3>
          <div className="yp-related-list">
            {related.map((track) => (
              <div
                key={track.videoId}
                className="yp-related-item"
                onClick={() => handlePlayTrack(track)}
              >
                <img src={track.thumbnail} alt="" className="yp-related-thumb" />
                <div className="yp-related-info">
                  <p className="yp-related-name">{track.title}</p>
                  <p className="yp-related-artist">{track.artist}</p>
                </div>
                <button className="yp-action-btn tiny" onClick={(e) => { e.stopPropagation(); handleAddToQueue(track); }}>+Q</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdFreeYouTube;
