import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';

function PlayerBar() {
  const {
    currentTrack, isPlaying, progress, volume, repeat, shuffle,
    pause, resume, goNext, goPrevious, seekTo,
    toggleShuffle, toggleRepeat, setVolume,
  } = useMusic();
  const [showQueue, setShowQueue] = useState(false);

  if (!currentTrack) return null;

  const pct = progress.duration > 0 ? (progress.elapsed / progress.duration) * 100 : 0;
  const fmt = (s) => {
    if (!s) return '0:00';
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

  return (
    <div className="unified-player-bar">
      <div className="player-progress-track" onClick={handleProgressClick}>
        <div className="player-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="player-bar-inner">
        <div className="player-track-info">
          {currentTrack.thumbnail && (
            <div
              className="player-thumb-sm"
              style={{ backgroundImage: `url(${currentTrack.thumbnail})`, backgroundSize: 'cover' }}
            />
          )}
          <div className="player-track-text">
            <p className="player-track-title">{currentTrack.title}</p>
            <p className="player-track-artist">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="player-center-controls">
          <button className={`player-btn small ${shuffle ? 'active' : ''}`} onClick={toggleShuffle} title="Shuffle">🔀</button>
          <button className="player-btn small" onClick={goPrevious} title="Previous">⏮</button>
          <button className="player-btn play-btn" onClick={isPlaying ? pause : resume} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? '⏸' : '▶️'}
          </button>
          <button className="player-btn small" onClick={goNext} title="Next">⏭</button>
          <button className={`player-btn small ${repeat !== 'off' ? 'active' : ''}`} onClick={toggleRepeat} title={`Repeat: ${repeat}`}>
            {repeat === 'one' ? '🔂' : '🔄'}
          </button>
        </div>

        <div className="player-right-controls">
          <span className="player-time">{fmt(progress.elapsed)} / {fmt(progress.duration)}</span>
          <div className="player-volume">
            <button className="player-btn small" onClick={() => setVolume(volume === 0 ? 50 : 0)}>
              {volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊'}
            </button>
            <input
              type="range" min="0" max="100" value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="volume-slider"
            />
          </div>
          <button
            className={`player-btn small ${showQueue ? 'active' : ''}`}
            onClick={() => setShowQueue(!showQueue)}
            title="Queue"
          >📋</button>
        </div>
      </div>
    </div>
  );
}

export default PlayerBar;
