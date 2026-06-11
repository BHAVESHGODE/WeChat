import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';

function PlayerControls({ onOpenNowPlaying }) {
  const {
    currentTrack, isPlaying, progress,
    shuffle, repeat, volume,
    pause, resume, goNext, goPrevious, seekTo,
    toggleShuffle, toggleRepeat, setVolume,
    showLyrics, setShowLyrics,
  } = useMusic();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  if (!currentTrack) return null;

  const pct = progress.duration > 0 ? (progress.elapsed / progress.duration) * 100 : 0;

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const p = x / rect.width;
    if (progress.duration > 0) seekTo(p * progress.duration);
  };

  const fmtTime = (s) => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const thumbBg = currentTrack.thumbnail
    ? `url(${currentTrack.thumbnail})`
    : 'linear-gradient(135deg, #7c4dff, #43e97b)';

  return (
    <>
      {currentTrack.thumbnail && (
        <div className="player-bg-blur" style={{ backgroundImage: `url(${currentTrack.thumbnail})` }} />
      )}
      <div className={`player-bar ${isPlaying ? 'player-bar--playing' : ''}`} role="region" aria-label="Player controls">
        <div className="player-progress-container">
          <span className="player-time-elapsed">{fmtTime(progress.elapsed)}</span>
          <div className="player-progress-track" onClick={handleProgressClick} role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={progress.duration} aria-valuenow={progress.elapsed} tabIndex={0}>
            <div className="player-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="player-time-duration">{fmtTime(progress.duration)}</span>
        </div>

        <div className="player-inner">
          {/* Left: Track Details */}
          <button
            className="player-track-info"
            onClick={onOpenNowPlaying}
            aria-label="Open now playing"
          >
            <div className="player-thumb" style={{ backgroundImage: thumbBg, backgroundSize: 'cover' }}>
              {isPlaying && <div className="player-thumb-ring" />}
            </div>
            <div className="player-track-text">
              <p className="player-track-title">{currentTrack.title}</p>
              <p className="player-track-artist">{currentTrack.artist}</p>
            </div>
          </button>

          {/* Center: Controls */}
          <div className="player-controls">
            {/* Shuffle */}
            <button
              className={`player-btn player-btn-shuffle ${shuffle ? 'active' : ''}`}
              onClick={toggleShuffle}
              aria-label={`Shuffle ${shuffle ? 'on' : 'off'}`}
              title="Shuffle"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm0.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
            </button>

            {/* Previous */}
            <button className="player-btn" onClick={goPrevious} aria-label="Previous track" title="Previous">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>

            {/* Backward 10s */}
            <button
              className="player-btn player-btn-seek"
              onClick={() => seekTo(Math.max(0, progress.elapsed - 10))}
              aria-label="Backward 10 seconds"
              title="Backward 10s"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05 1.05-6.9 2.75L3 8v8h8l-3.25-3.25c1.35-1.1 3.1-1.75 4.75-1.75 3.55 0 6.5 2.5 7.25 5.75l2-.5C20.75 12.25 17 9 12.5 9z"/></svg>
            </button>

            {/* Play/Pause */}
            <button
              className="player-btn player-btn-play"
              onClick={isPlaying ? pause : resume}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            {/* Forward 10s */}
            <button
              className="player-btn player-btn-seek"
              onClick={() => seekTo(Math.min(progress.duration, progress.elapsed + 10))}
              aria-label="Forward 10 seconds"
              title="Forward 10s"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11.5 8c2.65 0 5.05 1.05 6.9 2.75L21 8v8h-8l3.25-3.25c-1.35-1.1-3.1-1.75-4.75-1.75-3.55 0-6.5 2.5-7.25 5.75l-2-.5C3.25 12.25 7 9 11.5 9z"/></svg>
            </button>

            {/* Next */}
            <button className="player-btn" onClick={goNext} aria-label="Next track" title="Next">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>

            {/* Repeat */}
            <button
              className={`player-btn player-btn-repeat ${repeat !== 'off' ? 'active' : ''}`}
              onClick={toggleRepeat}
              aria-label={`Repeat ${repeat}`}
              title={`Repeat: ${repeat}`}
            >
              {repeat === 'one' ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/><text x="12" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">1</text></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
              )}
            </button>
          </div>

          {/* Right: Volume & Extras */}
          <div className="player-right">
            {/* Lyrics Toggle */}
            <button
              className={`player-btn player-btn-lyrics ${showLyrics ? 'active' : ''}`}
              onClick={() => setShowLyrics(!showLyrics)}
              aria-label="Toggle Lyrics"
              title="Lyrics"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h6V3h-8z"/></svg>
            </button>

            {/* Volume Control */}
            <div className="player-volume-wrap">
              <button
                className="player-btn"
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                aria-label="Volume"
                title="Volume"
              >
                {volume === 0 ? (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                )}
              </button>
              {showVolumeSlider && (
                <div className="player-volume-slider">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    aria-label="Volume"
                  />
                  <span>{volume}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PlayerControls;
