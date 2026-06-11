import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/YouTubeClone.css';

const API = process.env.REACT_APP_API_URL;

const CATEGORIES = [
  { id: '0', label: 'All' }, { id: '10', label: 'Music' },
  { id: '20', label: 'Gaming' }, { id: '24', label: 'Entertainment' },
  { id: '25', label: 'News' }, { id: '17', label: 'Sports' },
  { id: '27', label: 'Education' }, { id: '28', label: 'Science & Tech' },
  { id: '31', label: 'Anime' }, { id: '23', label: 'Comedy' },
];

const QUALITIES = [
  { label: 'Audio Only', value: 'audio', format: 'bestaudio[ext=m4a]/bestaudio' },
  { label: '144p', value: '144p', format: 'worst[height<=144]' },
  { label: '360p', value: '360p', format: 'best[height<=360]' },
  { label: '480p', value: '480p', format: 'best[height<=480]' },
  { label: '720p', value: '720p', format: 'best[height<=720]' },
  { label: '1080p', value: '1080p', format: 'best[height<=1080]' },
];

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const fmtDuration = (s) => {
  if (!s || !isFinite(s)) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

const fmtViews = (n) => {
  if (!n || n === 0) return '';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
};

const fmtTimeAgo = (d) => {
  if (!d) return '';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
};

function YouTubeClone() {
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [related, setRelated] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('0');
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [streamUrl, setStreamUrl] = useState('');
  const [playing, setPlaying] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);
  const [quality, setQuality] = useState('720p');
  const [playerErr, setPlayerErr] = useState(false);
  const [streamLoading, setStreamLoading] = useState(false);
  const [queue, setQueue] = useState([]);
  const [qIdx, setQIdx] = useState(-1);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState({ e: 0, d: 0 });
  const [showQ, setShowQ] = useState(false);
  const [favMsg, setFavMsg] = useState('');
  const [downloading, setDownloading] = useState({});
  const [showFavView, setShowFavView] = useState(false);

  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [theaterMode, setTheaterMode] = useState(false);
  const [loop, setLoop] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [miniPlayer, setMiniPlayer] = useState(false);

  const [playlists, setPlaylists] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ytc_playlists') || '[]'); } catch { return []; }
  });
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [expandedPlaylist, setExpandedPlaylist] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);

  const playerRef = useRef(null);
  const chipsRef = useRef(null);
  const miniPlayerRef = useRef(null);
  const controlsTimeout = useRef(null);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => { fetchTrending(); fetchFavorites(); }, []);

  useEffect(() => { if (!showFavView) fetchTrending(); }, [category]);

  useEffect(() => {
    try { localStorage.setItem('ytc_playlists', JSON.stringify(playlists)); } catch {}
  }, [playlists]);

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/adyoutube/trending?limit=24&category=${category}&region=IN`);
      const d = await r.json();
      if (d.tracks) setVideos(d.tracks);
    } catch {}
    setLoading(false);
  }, [category]);

  const fetchFavorites = async () => {
    try {
      const r = await fetch(`${API}/api/adyoutube/favorites`);
      const d = await r.json();
      if (d.tracks) setFavorites(d.tracks);
    } catch {}
  };

  const doSearch = async () => {
    if (!query.trim()) { setShowFavView(false); fetchTrending(); return; }
    setLoading(true);
    setShowFavView(false);
    try {
      const r = await fetch(`${API}/api/adyoutube/search?q=${encodeURIComponent(query)}&limit=24&category=${category}`);
      const d = await r.json();
      if (d.tracks) setVideos(d.tracks);
    } catch {}
    setLoading(false);
  };

  const getStream = useCallback(async (vid) => {
    setPlayerErr(false);
    setStreamLoading(true);
    const fmt = audioOnly ? 'bestaudio[ext=m4a]/bestaudio' : (QUALITIES.find(q => q.value === quality)?.format || 'best[height<=720]');
    try {
      const r = await fetch(`${API}/api/adyoutube/stream?videoId=${vid}&format=${encodeURIComponent(fmt)}`);
      const d = await r.json();
      if (d.streamUrl) { setStreamUrl(d.streamUrl); setStreamLoading(false); return true; }
    } catch {}
    setPlayerErr(true);
    setStreamLoading(false);
    return false;
  }, [audioOnly, quality]);

  const selectVideo = async (v) => {
    setSelected(v);
    setPlaying(false);
    setProgress({ e: 0, d: 0 });
    setStreamUrl('');
    setPlayerErr(false);
    setMiniPlayer(false);
    try {
      const r = await fetch(`${API}/api/adyoutube/related?videoId=${v.videoId}&limit=12`);
      const d = await r.json();
      if (d.tracks) setRelated(d.tracks);
    } catch {}
    await getStream(v.videoId);
  };

  useEffect(() => {
    if (selected && playerRef.current && streamUrl) {
      playerRef.current.load();
      const playPromise = playerRef.current.play();
      if (playPromise) playPromise.then(() => setPlaying(true)).catch(() => {});
    }
  }, [streamUrl]);

  useEffect(() => {
    if (selected && !showFavView) getStream(selected.videoId);
  }, [audioOnly, quality]);

  useEffect(() => {
    if (playerRef.current) playerRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    if (playerRef.current) playerRef.current.loop = loop;
  }, [loop]);

  useEffect(() => {
    if (playerRef.current) playerRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  /* ── Keyboard Shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      const t = e.target;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return;
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': skip(-10); break;
        case 'ArrowRight': skip(10); break;
        case 'ArrowUp': e.preventDefault(); adjVol(0.1); break;
        case 'ArrowDown': e.preventDefault(); adjVol(-0.1); break;
        case 'KeyF': e.preventDefault(); handleFullscreen(); break;
        case 'KeyM': e.preventDefault(); toggleMute(); break;
        case 'KeyT': e.preventDefault(); setTheaterMode(p => !p); break;
        case 'KeyL': e.preventDefault(); setLoop(p => !p); break;
        case 'KeyI': e.preventDefault(); handlePiP(); break;
        case 'Key?': case 'Slash': e.preventDefault(); setShowShortcuts(p => !p); break;
        case 'NumpadAdd': case 'Equal': e.preventDefault(); skip(10); break;
        case 'NumpadSubtract': case 'Minus': e.preventDefault(); skip(-10); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [playing, volume, muted]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (playing) { playerRef.current.pause(); setPlaying(false); }
    else {
      const p = playerRef.current.play();
      if (p) p.then(() => setPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    playerRef.current.muted = !muted;
    setMuted(!muted);
  };

  const adjVol = (delta) => {
    const v = Math.max(0, Math.min(1, volume + delta));
    setVolume(v);
    setMuted(v === 0);
    if (playerRef.current) { playerRef.current.volume = v; playerRef.current.muted = v === 0; }
  };

  const skip = (sec) => {
    if (!playerRef.current) return;
    playerRef.current.currentTime = Math.max(0, Math.min(playerRef.current.duration || 0, playerRef.current.currentTime + sec));
  };

  const handleSeek = (e) => {
    if (!playerRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const dur = playerRef.current.duration || progress.d;
    if (dur > 0) playerRef.current.currentTime = pct * dur;
  };

  const handleTimeUpdate = () => {
    if (playerRef.current) {
      setProgress({
        e: playerRef.current.currentTime,
        d: playerRef.current.duration || 0
      });
    }
  };

  const showCtrls = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  const handlePlayerMouseMove = () => showCtrls();

  /* ── Auto-play next ── */
  const handleEnded = () => {
    if (loop) return;
    if (qIdx < queue.length - 1) { playQ(qIdx + 1); return; }
    if (autoplay && related.length > 0) { selectVideo(related[0]); return; }
    setPlaying(false);
  };

  /* ── Queue ── */
  const addQueue = (v) => { setQueue(p => [...p, v]); setShowQ(true); };
  const playQ = (i) => { const v = queue[i]; if (v) { setQIdx(i); selectVideo(v); } };
  const nextQ = () => {
    if (qIdx < queue.length - 1) playQ(qIdx + 1);
    else if (autoplay && related.length) selectVideo(related[0]);
  };
  const prevQ = () => { if (qIdx > 0) playQ(qIdx - 1); };
  const remQ = (i) => {
    setQueue(p => p.filter((_, j) => j !== i));
    if (qIdx === i) setQIdx(-1);
    else if (qIdx > i) setQIdx(qIdx - 1);
  };

  /* ── Favorites ── */
  const toggleFav = async (v) => {
    const exists = favorites.some(f => f.videoId === v.videoId);
    try {
      if (exists) {
        await fetch(`${API}/api/adyoutube/favorites/${v.videoId}`, { method: 'DELETE' });
        setFavorites(p => p.filter(f => f.videoId !== v.videoId));
        setFavMsg('Removed from Favorites');
      } else {
        await fetch(`${API}/api/adyoutube/favorites`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId: v.videoId, title: v.title, artist: v.artist, thumbnail: v.thumbnail, duration: v.duration, views: v.views }),
        });
        setFavorites(p => [...p, v]);
        setFavMsg('Saved to Favorites!');
      }
    } catch {}
    setTimeout(() => setFavMsg(''), 2000);
  };

  const isFav = (id) => favorites.some(f => f.videoId === id);

  /* ── Download ── */
  const doDownload = async (v) => {
    setDownloading(d => ({ ...d, [v.videoId]: true }));
    try {
      await fetch(`${API}/api/adyoutube/cache`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: v.videoId, title: v.title, artist: v.artist, thumbnail: v.thumbnail, duration: v.duration, format: audioOnly ? 'audio' : 'video', quality }),
      });
      setFavMsg('Download cached!');
    } catch {}
    setDownloading(d => ({ ...d, [v.videoId]: false }));
    setTimeout(() => setFavMsg(''), 2000);
  };

  /* ── PiP / Fullscreen ── */
  const handlePiP = async () => {
    if (!playerRef.current) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await playerRef.current.requestPictureInPicture();
    } catch {}
  };

  const handleFullscreen = () => {
    if (!playerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else playerRef.current.requestFullscreen().catch(() => {});
  };

  /* ── Mini Player ── */
  const toggleMiniPlayer = () => {
    if (miniPlayer) { setMiniPlayer(false); return; }
    if (!selected) return;
    setMiniPlayer(true);
    if (playerRef.current) playerRef.current.pause();
    setPlaying(false);
  };

  /* ── Share ── */
  const copyLink = () => {
    if (!selected) return;
    navigator.clipboard.writeText(`${window.location.origin}/youtube?watch=${selected.videoId}`).then(
      () => setFavMsg('Link copied!'),
      () => setFavMsg('Failed to copy')
    );
    setTimeout(() => setFavMsg(''), 2000);
  };

  /* ── Playlists ── */
  const createPlaylist = () => {
    const name = newPlaylistName.trim();
    if (!name) return;
    setPlaylists(p => [...p, { id: Date.now().toString(), name, videos: [] }]);
    setNewPlaylistName('');
  };

  const deletePlaylist = (id) => {
    setPlaylists(p => p.filter(pl => pl.id !== id));
    if (expandedPlaylist === id) setExpandedPlaylist(null);
  };

  const addToPlaylist = (playlistId, video) => {
    setPlaylists(p => p.map(pl => {
      if (pl.id !== playlistId) return pl;
      if (pl.videos.some(v => v.videoId === video.videoId)) return pl;
      return { ...pl, videos: [...pl.videos, video] };
    }));
    setFavMsg('Added to playlist!');
    setTimeout(() => setFavMsg(''), 2000);
  };

  const removeFromPlaylist = (playlistId, videoId) => {
    setPlaylists(p => p.map(pl => {
      if (pl.id !== playlistId) return pl;
      return { ...pl, videos: pl.videos.filter(v => v.videoId !== videoId) };
    }));
  };

  const playPlaylist = (pl) => {
    if (pl.videos.length === 0) return;
    setQueue(pl.videos.slice(1));
    setQIdx(-1);
    setCurrentPlaylist(pl.id);
    selectVideo(pl.videos[0]);
  };

  const showFavorites = () => {
    setShowFavView(true);
    fetchFavorites();
  };

  const goHome = () => {
    setSelected(null);
    setStreamUrl('');
    setPlaying(false);
    setShowFavView(false);
    setQuery('');
    setMiniPlayer(false);
    fetchTrending();
  };

  const displayVideos = showFavView ? favorites : videos;

  return (
    <div className="ytc" onClick={() => setShowShortcuts(false)}>
      {/* Header */}
      <header className="ytc-header">
        <div className="ytc-logo" onClick={goHome}>
          <span className="ytc-logo-icon">▶</span>
          YouTube <span className="ytc-logo-badge">Premium</span>
        </div>
        <div className="ytc-search-wrap">
          <div className="ytc-search">
            <input
              placeholder="Search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
            />
            <button onClick={doSearch}>🔍</button>
          </div>
        </div>
        <div className="ytc-hdr-actions">
          <button className="ytc-hdr-btn ytc-hdr-badge" data-count={favorites.length} onClick={showFavorites} title="Favorites">❤️</button>
          <button className="ytc-hdr-btn ytc-hdr-badge" data-count={queue.length} onClick={() => setShowQ(!showQ)} title="Queue">📋</button>
          <button className="ytc-hdr-btn" onClick={() => setShowPlaylists(!showPlaylists)} title="Playlists">📂</button>
          <button className="ytc-hdr-btn" onClick={() => setShowShortcuts(true)} title="Keyboard Shortcuts">⌨</button>
        </div>
      </header>

      {/* Category Chips */}
      {!selected && !showFavView && (
        <div className="ytc-chips" ref={chipsRef}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              className={`ytc-chip ${category === c.id ? 'active' : ''}`}
              onClick={() => setCategory(c.id)}
            >{c.label}</button>
          ))}
        </div>
      )}

      {favMsg && <div className="ytc-msg">{favMsg}</div>}

      {/* Watch View */}
      {selected && !miniPlayer ? (
        <div className={`ytc-watch ${theaterMode ? 'theater' : ''}`}>
          <div className="ytc-player-section">
            <div className="ytc-player-wrap" onMouseMove={handlePlayerMouseMove} onMouseLeave={() => setShowControls(false)}>
              {streamUrl ? (
                <video
                  ref={playerRef}
                  className="ytc-player"
                  src={streamUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleTimeUpdate}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onEnded={handleEnded}
                  onClick={togglePlay}
                  controlsList="nodownload"
                  playsInline
                  onError={() => setPlayerErr(true)}
                />
              ) : playerErr ? (
                <div className="ytc-player-placeholder">
                  <p style={{ color: '#888' }}>Stream unavailable. Using embed.</p>
                  <iframe
                    src={`https://www.youtube.com/embed/${selected.videoId}?autoplay=1&rel=0`}
                    className="ytc-player-embed"
                    allow="autoplay; encrypted-media"
                    title="yt"
                  />
                </div>
              ) : (
                <div className="ytc-player-placeholder">
                  <div className="ytc-spinner" />
                  {streamLoading && <p style={{ color: '#888', fontSize: 13 }}>Loading stream...</p>}
                </div>
              )}

              <div className={`ytc-controls ${showControls ? 'show' : ''}`}>
                <div className="ytc-progress-bar" onClick={handleSeek}>
                  <div className="ytc-progress-buffer" style={{ width: '40%' }} />
                  <div
                    className="ytc-progress-fill"
                    style={{ width: `${progress.d > 0 ? (progress.e / progress.d) * 100 : 0}%` }}
                  />
                </div>
                <div className="ytc-controls-row">
                  <div className="ytc-ctrl-left">
                    <button className="ytc-ctrl-btn" onClick={prevQ} title="Previous (Shift+P)">⏮</button>
                    <button className="ytc-ctrl-btn" onClick={() => skip(-10)} title="Back 10s (←)">⏪</button>
                    <button className="ytc-ctrl-btn" onClick={togglePlay} title={playing ? 'Pause (Space)' : 'Play (Space)'}>
                      {playing ? '⏸' : '▶️'}
                    </button>
                    <button className="ytc-ctrl-btn" onClick={() => skip(10)} title="Forward 10s (→)">⏩</button>
                    <button className="ytc-ctrl-btn" onClick={nextQ} title="Next (Shift+N)">⏭</button>
                    <button className={`ytc-ctrl-btn ${loop ? 'active' : ''}`} onClick={() => setLoop(p => !p)} title={`Loop ${loop ? 'ON' : 'OFF'} (L)`}>🔁</button>
                    <button className="ytc-ctrl-btn" onClick={toggleMute} title={muted ? 'Unmute (M)' : 'Mute (M)'}>
                      {muted ? '🔇' : volume < 0.3 ? '🔈' : volume < 0.7 ? '🔉' : '🔊'}
                    </button>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={muted ? 0 : volume}
                      onChange={e => { const v = parseFloat(e.target.value); setVolume(v); setMuted(v === 0); if (playerRef.current) { playerRef.current.volume = v; playerRef.current.muted = v === 0; } }}
                      className="ytc-vol-slider"
                    />
                    <span className="ytc-time">{fmtDuration(progress.e)} / {fmtDuration(progress.d)}</span>
                  </div>
                  <div className="ytc-ctrl-right">
                    <select className="ytc-select" value={playbackSpeed} onChange={e => setPlaybackSpeed(parseFloat(e.target.value))} style={{ fontSize: 11, padding: '2px 6px' }}>
                      {SPEEDS.map(s => <option key={s} value={s}>{s}x</option>)}
                    </select>
                    <button className={`ytc-ctrl-btn ${theaterMode ? 'active' : ''}`} onClick={() => setTheaterMode(p => !p)} title="Theater Mode (T)">🖥</button>
                    <button className="ytc-ctrl-btn" onClick={handlePiP} title="PiP (I)">📺</button>
                    <button className="ytc-ctrl-btn" onClick={handleFullscreen} title="Fullscreen (F)">⛶</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="ytc-info-section">
              <h1 className="ytc-video-title">{selected.title}</h1>
              <div className="ytc-video-meta">
                <span className="ytc-video-stats">
                  {fmtViews(selected.views)} views • {fmtTimeAgo(selected.publishedAt)}
                  <button className="ytc-action-btn" onClick={copyLink} style={{ padding: '2px 10px', fontSize: 12 }}>🔗 Share</button>
                </span>
                <div className="ytc-actions">
                  <button
                    className={`ytc-action-btn ${isFav(selected.videoId) ? 'active' : ''}`}
                    onClick={() => toggleFav(selected)}
                  >
                    {isFav(selected.videoId) ? '❤️ Saved' : '🤍 Save'}
                  </button>
                  <button className="ytc-action-btn" onClick={() => addQueue(selected)}>➕ Queue</button>
                  <button className="ytc-action-btn" onClick={toggleMiniPlayer}>📺 Mini</button>
                  <button
                    className="ytc-action-btn"
                    onClick={() => doDownload(selected)}
                    disabled={downloading[selected.videoId]}
                  >
                    {downloading[selected.videoId] ? '⏳' : '⬇'}
                  </button>
                </div>
              </div>
              <div className="ytc-channel-row">
                <div className="ytc-channel-avatar">{selected.artist?.[0] || '?'}</div>
                <div className="ytc-channel-info">
                  <div className="ytc-channel-name">{selected.artist || 'Unknown'}</div>
                  <div className="ytc-channel-subs">{fmtViews(Math.floor(Math.random() * 5000000 + 10000))} subscribers</div>
                </div>
              </div>
              <div className="ytc-settings">
                <label className="ytc-toggle">
                  <input type="checkbox" checked={audioOnly} onChange={() => setAudioOnly(!audioOnly)} />
                  🎧 Audio Only
                </label>
                <label className="ytc-toggle">
                  <input type="checkbox" checked={autoplay} onChange={() => setAutoplay(!autoplay)} />
                  ▶ Autoplay
                </label>
                <label className="ytc-toggle">
                  <input type="checkbox" checked={loop} onChange={() => setLoop(!loop)} />
                  🔁 Loop
                </label>
                <select className="ytc-select" value={quality} onChange={e => setQuality(e.target.value)}>
                  {QUALITIES.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                </select>
                <select className="ytc-select" value={playbackSpeed} onChange={e => setPlaybackSpeed(parseFloat(e.target.value))}>
                  {SPEEDS.map(s => <option key={s} value={s}>{s}x</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Related Sidebar */}
          <div className="ytc-sidebar">
            <div className="ytc-sidebar-title">
              Related
              <label><input type="checkbox" checked={autoplay} onChange={() => setAutoplay(!autoplay)} /> Autoplay</label>
            </div>
            {related.map((v, i) => (
              <div key={v.videoId || i} className="ytc-related-card" onClick={() => selectVideo(v)}>
                <img src={v.thumbnail} alt="" className="ytc-related-thumb" loading="lazy" />
                <div className="ytc-related-info">
                  <div className="ytc-related-title">{v.title}</div>
                  <div className="ytc-related-meta">{v.artist}</div>
                  <div className="ytc-related-meta">{fmtViews(v.views)} views</div>
                </div>
              </div>
            ))}
            {related.length === 0 && !streamLoading && (
              <p style={{ color: '#888', fontSize: 13, padding: '20px 6px' }}>No related videos found.</p>
            )}
          </div>
        </div>
      ) : selected && miniPlayer ? (
        /* Mini Player View (shows grid behind) */
        <>
          <div className="ytc-mini-player" ref={miniPlayerRef}>
            {streamUrl && (
              <video src={streamUrl} autoPlay loop={loop} muted={muted}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={handleEnded}
                playsInline
              />
            )}
            <button className="ytc-mini-player-close" onClick={toggleMiniPlayer}>✕</button>
          </div>
          <div className="ytc-chips" ref={chipsRef}>
            {CATEGORIES.map(c => (
              <button key={c.id} className={`ytc-chip ${category === c.id ? 'active' : ''}`} onClick={() => setCategory(c.id)}>{c.label}</button>
            ))}
          </div>
          {loading ? (
            <div className="ytc-loading"><div className="ytc-spinner" /></div>
          ) : displayVideos.length === 0 ? (
            <div className="ytc-empty">
              <span className="ytc-empty-icon">🎬</span>
              <p>{showFavView ? 'No favorites yet.' : 'No videos found.'}</p>
            </div>
          ) : (
            <div className="ytc-grid-wrap">
              <div className="ytc-grid">
                {displayVideos.map((v, i) => (
                  <div key={v.videoId || i} className="ytc-card" onClick={() => selectVideo(v)}>
                    <div className="ytc-thumb-wrap">
                      <img src={v.thumbnail} alt="" className="ytc-thumb" loading="lazy" />
                      {v.duration > 0 && <span className="ytc-dur">{fmtDuration(v.duration)}</span>}
                    </div>
                    <div className="ytc-card-body">
                      <div className="ytc-avatar">{v.artist?.[0] || '?'}</div>
                      <div className="ytc-card-info">
                        <div className="ytc-card-title">{v.title}</div>
                        <div className="ytc-card-meta">{v.artist}</div>
                        <div className="ytc-card-meta">{fmtViews(v.views)} views • {fmtTimeAgo(v.publishedAt)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {loading ? (
            <div className="ytc-loading"><div className="ytc-spinner" /></div>
          ) : displayVideos.length === 0 ? (
            <div className="ytc-empty">
              <span className="ytc-empty-icon">🎬</span>
              <p>{showFavView ? 'No favorites yet. Save some videos!' : 'No videos found. Try a different search or category.'}</p>
            </div>
          ) : (
            <div className="ytc-grid-wrap">
              <div className="ytc-grid">
                {displayVideos.map((v, i) => (
                  <div key={v.videoId || i} className="ytc-card" onClick={() => selectVideo(v)}>
                    <div className="ytc-thumb-wrap">
                      <img src={v.thumbnail} alt="" className="ytc-thumb" loading="lazy" />
                      {v.duration > 0 && <span className="ytc-dur">{fmtDuration(v.duration)}</span>}
                    </div>
                    <div className="ytc-card-body">
                      <div className="ytc-avatar">{v.artist?.[0] || '?'}</div>
                      <div className="ytc-card-info">
                        <div className="ytc-card-title">{v.title}</div>
                        <div className="ytc-card-meta">{v.artist}</div>
                        <div className="ytc-card-meta">{fmtViews(v.views)} views • {fmtTimeAgo(v.publishedAt)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Queue Panel */}
      {showQ && queue.length > 0 && (
        <div className="ytc-queue-panel">
          <div className="ytc-queue-header">
            <span className="ytc-queue-title">Up Next ({queue.length})</span>
            <button className="ytc-queue-close" onClick={() => setShowQ(false)}>✕</button>
          </div>
          <div className="ytc-queue-list">
            {queue.map((v, i) => (
              <div
                key={i}
                className={`ytc-queue-item ${qIdx === i ? 'active' : ''}`}
                onClick={() => playQ(i)}
              >
                <img src={v.thumbnail} alt="" className="ytc-queue-thumb" />
                <div className="ytc-queue-info">
                  <div className="ytc-queue-item-title">{v.title}</div>
                  <div className="ytc-queue-item-artist">{v.artist}</div>
                </div>
                <button className="ytc-queue-remove" onClick={e => { e.stopPropagation(); remQ(i); }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playlists Panel */}
      {showPlaylists && (
        <div className="ytc-playlist-panel">
          <div className="ytc-playlist-header">
            <span className="ytc-playlist-title">Playlists ({playlists.length})</span>
            <button className="ytc-playlist-close" onClick={() => setShowPlaylists(false)}>✕</button>
          </div>
          <div className="ytc-playlist-creator">
            <input
              placeholder="New playlist name..."
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createPlaylist()}
            />
            <button onClick={createPlaylist}>Create</button>
          </div>
          <div className="ytc-playlist-list">
            {playlists.length === 0 ? (
              <div className="ytc-playlist-empty">No playlists yet. Create one!</div>
            ) : (
              playlists.map(pl => (
                <div key={pl.id}>
                  <div
                    className={`ytc-playlist-item ${expandedPlaylist === pl.id ? 'active' : ''}`}
                    onClick={() => setExpandedPlaylist(expandedPlaylist === pl.id ? null : pl.id)}
                  >
                    <span className="ytc-playlist-icon">🎵</span>
                    <span className="ytc-playlist-name">{pl.name}</span>
                    <span className="ytc-playlist-count">{pl.videos.length}</span>
                    <button className="ytc-playlist-close" onClick={e => { e.stopPropagation(); deletePlaylist(pl.id); }} style={{ fontSize: 12 }}>🗑</button>
                  </div>
                  {expandedPlaylist === pl.id && (
                    <div className="ytc-pl-videos">
                      {selected && (
                        <div className="ytc-pl-video" onClick={() => addToPlaylist(pl.id, selected)}>
                          <span style={{ fontSize: 14, padding: '0 4px' }}>➕</span>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>Add current video</span>
                        </div>
                      )}
                      {pl.videos.map(v => (
                        <div key={v.videoId} className="ytc-pl-video" onClick={() => selectVideo(v)}>
                          <img src={v.thumbnail} alt="" className="ytc-pl-video-thumb" />
                          <div className="ytc-pl-video-info">
                            <div className="ytc-pl-video-title">{v.title}</div>
                          </div>
                          <button className="ytc-pl-video-remove" onClick={e => { e.stopPropagation(); removeFromPlaylist(pl.id, v.videoId); }}>✕</button>
                        </div>
                      ))}
                      {pl.videos.length > 0 && (
                        <div className="ytc-pl-video" onClick={() => playPlaylist(pl)} style={{ color: '#3ea6ff', fontWeight: 500 }}>
                          ▶ Play all ({pl.videos.length})
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="ytc-shortcuts-hint" onClick={e => e.stopPropagation()}>
          <h3>⌨ Keyboard Shortcuts</h3>
          <div className="ytc-shortcut-row"><span>Play / Pause</span><span className="ytc-shortcut-key">Space</span></div>
          <div className="ytc-shortcut-row"><span>Seek backward 10s</span><span className="ytc-shortcut-key">←</span></div>
          <div className="ytc-shortcut-row"><span>Seek forward 10s</span><span className="ytc-shortcut-key">→</span></div>
          <div className="ytc-shortcut-row"><span>Volume up / down</span><span className="ytc-shortcut-key">↑ ↓</span></div>
          <div className="ytc-shortcut-row"><span>Fullscreen</span><span className="ytc-shortcut-key">F</span></div>
          <div className="ytc-shortcut-row"><span>Theater Mode</span><span className="ytc-shortcut-key">T</span></div>
          <div className="ytc-shortcut-row"><span>Mute / Unmute</span><span className="ytc-shortcut-key">M</span></div>
          <div className="ytc-shortcut-row"><span>Loop toggle</span><span className="ytc-shortcut-key">L</span></div>
          <div className="ytc-shortcut-row"><span>Picture-in-Picture</span><span className="ytc-shortcut-key">I</span></div>
          <div className="ytc-shortcut-row"><span>Close hints</span><span className="ytc-shortcut-key">?</span></div>
          <p style={{ textAlign: 'center', color: '#888', fontSize: 11, marginTop: 12 }}>Click anywhere outside to close</p>
        </div>
      )}
    </div>
  );
}

export default YouTubeClone;
