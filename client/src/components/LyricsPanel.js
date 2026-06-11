import React from 'react';

function LyricsPanel({ lyrics, title, artist, onClose }) {
  if (!lyrics) {
    return (
      <div className="lyrics-panel">
        <div className="lyrics-header">
          <h3>Lyrics</h3>
          <button className="lyrics-close" onClick={onClose}>✕</button>
        </div>
        <div className="lyrics-empty">
          <p>No lyrics available for "{title}"</p>
          {artist && <p className="lyrics-empty-sub">by {artist}</p>}
        </div>
      </div>
    );
  }

  const lines = lyrics.split('\n').filter((l) => l.trim());

  return (
    <div className="lyrics-panel">
      <div className="lyrics-header">
        <h3>Lyrics</h3>
        <button className="lyrics-close" onClick={onClose}>✕</button>
      </div>
      <div className="lyrics-content">
        <p className="lyrics-song-title">{title}</p>
        {artist && <p className="lyrics-song-artist">{artist}</p>}
        <div className="lyrics-lines">
          {lines.map((line, i) => (
            <p key={i} className="lyrics-line">{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LyricsPanel;
