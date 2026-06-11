import React, { useState } from 'react';

const LOFI_VIDEO_ID = 'jfKfPfyJRdk';

function AudioPlayer() {
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => setPlaying((prev) => !prev);

  return (
    <div className="study-card audio-card">
      <h2 className="study-card-title">🎵 Lofi Beats</h2>
      <button className="study-btn audio-btn" onClick={togglePlay}>
        {playing ? '⏸ Pause' : '▶ Play'}
      </button>
      {playing && (
        <div className="audio-embed">
          <iframe
            src={`https://www.youtube.com/embed/${LOFI_VIDEO_ID}?autoplay=1&loop=1&playlist=${LOFI_VIDEO_ID}`}
            title="Lofi Hip Hop Radio"
            allow="autoplay"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

export default AudioPlayer;
