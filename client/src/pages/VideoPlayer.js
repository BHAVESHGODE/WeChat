import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/VideoPlayer.css';

const API = process.env.REACT_APP_API_URL;
const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const SKIP_SECONDS = 10;

function VideoPlayer({ episodeId, animeTitle, episodeNumber, source, onPrev, onNext, hasPrev, hasNext }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeout = useRef(null);
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('vp_volume') || '1'));
  const [playbackSpeed, setPlaybackSpeed] = useState(() => parseFloat(localStorage.getItem('vp_speed') || '1'));
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const fetchVideo = useCallback(async () => {
    if (!episodeId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/streaming-video/watch?id=${encodeURIComponent(episodeId)}&source=${source || 'gogoanime'}`);
      const data = await res.json();
      if (data.data) {
        setVideoData(data.data);
        const bestSource = data.data.sources?.find((s) => s.quality === 'default' || s.quality === 'auto')
          || data.data.sources?.find((s) => s.quality === '1080p' || s.quality === '720p')
          || data.data.sources?.[0];
        if (videoRef.current && bestSource) {
          videoRef.current.src = bestSource.url;
          videoRef.current.load();
        }
      } else {
        setError('No video sources found');
      }
    } catch {
      setError('Failed to load video');
    }
    setLoading(false);
  }, [episodeId, source]);

  useEffect(() => { fetchVideo(); }, [fetchVideo]);

  useEffect(() => {
    const handleKey = (e) => {
      if (!videoRef.current) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': skip(-SKIP_SECONDS); break;
        case 'ArrowRight': skip(SKIP_SECONDS); break;
        case 'ArrowUp': e.preventDefault(); changeVolume(Math.min(1, volume + 0.1)); break;
        case 'ArrowDown': e.preventDefault(); changeVolume(Math.max(0, volume - 0.1)); break;
        case 'KeyF': toggleFullscreen(); break;
        case 'KeyM': toggleMute(); break;
        case 'KeyN': hasNext && onNext?.(); break;
        case 'KeyP': hasPrev && onPrev?.(); break;
        case 'Comma': skip(-85); break;
        case 'Period': skip(85); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [volume, hasPrev, hasNext]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.buffered.length > 0) {
        setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.volume = volume;
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleProgressClick = (e) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = ratio * duration;
  };

  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
    localStorage.setItem('vp_speed', speed.toString());
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!document.fullscreenElement) {
      try { await el?.requestFullscreen(); setIsFullscreen(true); } catch {}
    } else {
      try { await document.exitFullscreen(); setIsFullscreen(false); } catch {}
    }
  };

  const skip = (seconds) => {
    if (videoRef.current && duration) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
    }
  };

  const changeVolume = (val) => {
    const v = Math.max(0, Math.min(1, val));
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    localStorage.setItem('vp_volume', v.toString());
    if (v > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const formatTime = (t) => {
    if (isNaN(t) || !isFinite(t)) return '0:00';
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  useEffect(() => {
    return () => { if (controlsTimeout.current) clearTimeout(controlsTimeout.current); };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className="vp-wrapper">
      <div className="vp-top-bar">
        <div className="vp-top-left">
          <span className="vp-title">{animeTitle || 'Loading...'}</span>
          {episodeNumber && <span className="vp-episode">Episode {episodeNumber}</span>}
        </div>
        <div className="vp-top-right">
          <button className="vp-btn vp-btn-nav" disabled={!hasPrev} onClick={onPrev} title="Previous (P)">
            <span>⏮</span> Prev
          </button>
          <button className="vp-btn vp-btn-nav" disabled={!hasNext} onClick={onNext} title="Next (N)">
            Next <span>⏭</span>
          </button>
        </div>
      </div>

      <div className="vp-container" ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={() => isPlaying && setShowControls(false)}>
        {loading ? (
          <div className="vp-loading">
            <div className="vp-spinner" />
            <p>Loading video stream...</p>
          </div>
        ) : error ? (
          <div className="vp-error">
            <span className="vp-error-icon">🎬</span>
            <p>{error}</p>
            <span className="vp-error-hint">Try switching source or episode</span>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="vp-video"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => { setIsPlaying(false); if (hasNext && onNext) onNext(); }}
              onError={() => setError('Video failed to load')}
              onClick={togglePlay}
              playsInline
            >
              {videoData?.subtitles?.map((sub, i) => (
                <track key={i} kind="subtitles" src={sub.url} srcLang={sub.lang} label={sub.lang} />
              ))}
            </video>

            <div className={`vp-overlay ${showControls ? 'visible' : ''}`}>
              <div className="vp-center-play" onClick={togglePlay}>
                {!isPlaying && <span className="vp-big-play">▶</span>}
              </div>

              <div className="vp-bottom-controls">
                <div className="vp-progress-wrap" onClick={handleProgressClick}>
                  <div className="vp-progress-bg">
                    <div className="vp-progress-buffered" style={{ width: `${bufPct}%` }} />
                    <div className="vp-progress-fill" style={{ width: `${pct}%` }} />
                    <div className="vp-progress-thumb" style={{ left: `${pct}%` }} />
                  </div>
                </div>

                <div className="vp-controls-row">
                  <div className="vp-controls-left">
                    <button className="vp-btn" onClick={togglePlay} title="Play/Pause (Space)">
                      {isPlaying ? '⏸' : '▶️'}
                    </button>
                    <button className="vp-btn" onClick={() => skip(-SKIP_SECONDS)} title="Back 10s (←)">↺ 10</button>
                    <button className="vp-btn" onClick={() => skip(SKIP_SECONDS)} title="Forward 10s (→)">10 ↻</button>
                    <span className="vp-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
                  </div>

                  <div className="vp-controls-right">
                    <div className="vp-vol-wrap"
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
                    >
                      <button className="vp-btn" onClick={toggleMute} title="Mute (M)">
                        {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                      </button>
                      {showVolumeSlider && (
                        <div className="vp-vol-slider">
                          <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume}
                            onChange={(e) => changeVolume(parseFloat(e.target.value))} />
                        </div>
                      )}
                    </div>

                    <div className="vp-speed-wrap">
                      <button className="vp-btn vp-speed-btn" onClick={() => setShowSpeedMenu(!showSpeedMenu)} title="Speed">
                        {playbackSpeed}x
                      </button>
                      {showSpeedMenu && (
                        <div className="vp-speed-menu">
                          {PLAYBACK_SPEEDS.map((s) => (
                            <button key={s} className={`vp-speed-opt ${playbackSpeed === s ? 'active' : ''}`}
                              onClick={() => changeSpeed(s)}>{s}x</button>
                          ))}
                        </div>
                      )}
                    </div>

                    {videoData?.subtitles?.length > 0 && (
                      <select className="vp-sub-select" value={selectedSubtitle}
                        onChange={(e) => {
                          const lang = e.target.value;
                          setSelectedSubtitle(lang);
                          if (videoRef.current) {
                            const tracks = videoRef.current.textTracks;
                            for (let i = 0; i < tracks.length; i++) {
                              tracks[i].mode = tracks[i].language === lang ? 'showing' : 'hidden';
                            }
                          }
                        }}>
                        <option value="">Sub: Off</option>
                        {videoData.subtitles.map((sub, i) => (
                          <option key={i} value={sub.lang}>{sub.lang}</option>
                        ))}
                      </select>
                    )}

                    <button className="vp-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
                      {isFullscreen ? '⛶' : '⛶'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default VideoPlayer;
