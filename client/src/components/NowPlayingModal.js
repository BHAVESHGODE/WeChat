import React, { useEffect, useRef, useCallback } from 'react';
import { useMusic } from '../context/MusicContext';
import useSwipe from '../hooks/useSwipe';

function NowPlayingModal({ onClose }) {
  const {
    currentTrack, isPlaying, progress, volume,
    shuffle, repeat, lyrics, showLyrics,
    pause, resume, goNext, goPrevious, seekTo,
    toggleShuffle, toggleRepeat, setVolume,
    setShowLyrics, queue, queueIndex,
  } = useMusic();

  const modalRef = useRef(null);
  const [showFullLyrics, setShowFullLyrics] = React.useState(false);

  const handleSwipeDown = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSwipeLeft = useCallback(() => {
    goNext();
  }, [goNext]);

  const handleSwipeRight = useCallback(() => {
    goPrevious();
  }, [goPrevious]);

  const swipeHandlers = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    onSwipeDown: handleSwipeDown,
    threshold: 50,
  });

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrevious();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === ' ') { e.preventDefault(); isPlaying ? pause() : resume(); }
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goNext, goPrevious, isPlaying, pause, resume]);

  const pct = progress.duration > 0 ? (progress.elapsed / progress.duration) * 100 : 0;
  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const p = x / rect.width;
    if (progress.duration > 0) seekTo(p * progress.duration);
  };

  if (!currentTrack) return null;

  const isYouTube = currentTrack.source === 'adyoutube' || currentTrack.source === 'youtube';
  const thumbBg = currentTrack.thumbnail
    ? `url(${currentTrack.thumbnail})`
    : 'linear-gradient(135deg, #7c4dff, #43e97b)';

  const hasLyrics = lyrics && lyrics.length > 0;

  return (
    <div
      className="nowplaying-overlay"
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Now Playing"
    >
      {currentTrack.thumbnail && (
        <div className="nowplaying-bg-blur" style={{ backgroundImage: thumbBg }} />
      )}
      <div className="nowplaying-gradient" />

      <div className="nowplaying-container" {...swipeHandlers}>
        <div className="nowplaying-drag-handle" onClick={onClose} aria-label="Close">
          <span className="nowplaying-drag-bar" />
        </div>

        <div className="nowplaying-art-wrap">
          <div className="nowplaying-art" style={{ backgroundImage: thumbBg }}>
            {!currentTrack.thumbnail && <span className="nowplaying-art-emoji">🎵</span>}
          </div>
        </div>

        <div className="nowplaying-info">
          <h2 className="nowplaying-title">{currentTrack.title}</h2>
          <p className="nowplaying-artist">{currentTrack.artist}</p>
        </div>

        {isPlaying && (
          <div className="nowplaying-visualizer" aria-hidden="true">
            {Array.from({ length: 32 }).map((_, i) => (
              <span key={i} className="nowplaying-visualizer-bar" style={{ animationDelay: `${i * 0.05}s` }} />
            ))}
          </div>
        )}

        <div className="nowplaying-progress" onClick={handleProgressClick} role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={progress.duration} aria-valuenow={progress.elapsed} tabIndex={0}>
          <div className="nowplaying-progress-track">
            <div className="nowplaying-progress-fill" style={{ width: `${pct}%` }} />
            <div className="nowplaying-progress-thumb" style={{ left: `${pct}%` }} />
          </div>
          <div className="nowplaying-time">
            <span>{fmt(progress.elapsed)}</span>
            <span>{fmt(progress.duration)}</span>
          </div>
        </div>

        <div className="nowplaying-controls">
          <button className="nowplaying-btn" onClick={toggleShuffle} aria-label={`Shuffle ${shuffle ? 'on' : 'off'}`} aria-pressed={shuffle}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm0.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
          </button>
          <button className="nowplaying-btn nowplaying-btn-skip" onClick={goPrevious} aria-label="Previous track">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button
            className="nowplaying-btn nowplaying-btn-play"
            onClick={isPlaying ? pause : resume}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button className="nowplaying-btn nowplaying-btn-skip" onClick={goNext} aria-label="Next track">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
          <button className={`nowplaying-btn ${repeat !== 'off' ? 'active' : ''}`} onClick={toggleRepeat} aria-label={`Repeat ${repeat}`} aria-pressed={repeat !== 'off'}>
            {repeat === 'one' ? (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/><text x="12" y="18" textAnchor="middle" fontSize="9" fill="currentColor">1</text></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
            )}
          </button>
        </div>

        <div className="nowplaying-extras">
          <div className="nowplaying-volume">
            <button className="nowplaying-btn" onClick={() => setVolume(volume === 0 ? 80 : 0)} aria-label={volume === 0 ? 'Unmute' : 'Mute'}>
              {volume === 0 ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
              )}
            </button>
            <input
              className="nowplaying-volume-slider"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
            />
          </div>
          {isYouTube && (
            <button className="nowplaying-btn" onClick={() => {}} aria-label="Download">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            </button>
          )}
          {hasLyrics && (
            <button
              className={`nowplaying-btn ${showFullLyrics ? 'active' : ''}`}
              onClick={() => setShowFullLyrics(!showFullLyrics)}
              aria-label="Toggle lyrics"
              aria-pressed={showFullLyrics}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8.5 14.5A3.5 3.5 0 0 0 5 18c0 1.93 1.57 3.5 3.5 3.5S12 19.93 12 18V9c0-1.93-1.57-3.5-3.5-3.5S5 7.07 5 9c0 1.93 1.57 3.5 3.5 3.5zM20 8h-6v2h6V8zm0-4h-6v2h6V4z"/></svg>
            </button>
          )}
        </div>

        {hasLyrics && showFullLyrics && (
          <div className="nowplaying-lyrics" role="region" aria-label="Lyrics">
            {lyrics.split('\n').filter(l => l.trim()).map((line, i) => (
              <p key={i} className="nowplaying-lyrics-line">{line}</p>
            ))}
          </div>
        )}

        {queue.length > 0 && (
          <div className="nowplaying-queue-pill" onClick={() => {}} role="button" tabIndex={0} aria-label={`${queue.length} songs in queue`}>
            <span>Up next: {queue[queueIndex >= 0 ? Math.min(queueIndex, queue.length - 1) : 0]?.title}</span>
            <span className="nowplaying-queue-count">{queue.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default NowPlayingModal;
