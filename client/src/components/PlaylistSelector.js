import React, { useState, useRef, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';

const icons = ['🎧', '🔥', '💕', '🎸', '🎹', '🎤'];

function PlaylistSelector() {
  const { playlists, currentPlaylist, selectPlaylist, currentTrack, isPlaying, play, pause } = useMusic();
  const [showTracks, setShowTracks] = useState(null);
  const scrollRef = useRef(null);

  const handleCardClick = (pl) => {
    selectPlaylist(pl);
    setShowTracks(pl);
  };

  const handleTrackClick = (track, idx, tracks) => {
    const isSame = currentTrack && (
      (currentTrack._id && track._id && currentTrack._id === track._id) ||
      (currentTrack.title === track.title && currentTrack.artist === track.artist)
    );
    if (isSame && isPlaying) { pause(); return; }
    if (isSame) { play(track, idx, tracks); return; }
    play(track, idx, tracks);
  };

  return (
    <div className="music-section">
      <h2 className="music-section-title">Choose a Playlist</h2>
      <div className="playlist-carousel" ref={scrollRef}>
        {playlists.map((pl, i) => (
          <button
            key={pl._id}
            className={`playlist-carousel-card ${currentPlaylist?._id === pl._id ? 'active' : ''}`}
            onClick={() => handleCardClick(pl)}
            aria-label={`${pl.name} — ${pl.tracks.length} tracks`}
          >
            <span className="playlist-carousel-icon">{icons[i % icons.length]}</span>
            <span className="playlist-carousel-name">{pl.name}</span>
            <span className="playlist-carousel-count">{pl.tracks.length} tracks</span>
          </button>
        ))}
      </div>

      {showTracks && (
        <div className="playlist-tracks-modal" role="dialog" aria-modal="true" aria-label={`${showTracks.name} tracks`}>
          <div className="playlist-tracks-header">
            <h3>{showTracks.name}</h3>
            <button className="playlist-tracks-close" onClick={() => setShowTracks(null)} aria-label="Close">
              ✕
            </button>
          </div>
          <div className="track-list">
            {showTracks.tracks.map((track, idx) => (
              <div
                key={track._id || track.videoId || idx}
                className={`track-item ${currentTrack?._id === track._id || (currentTrack?.title === track.title && currentTrack?.artist === track.artist) ? 'active' : ''}`}
                onClick={() => handleTrackClick(track, idx, showTracks.tracks)}
                role="button"
                tabIndex={0}
                aria-label={`${track.title} by ${track.artist}`}
                onKeyDown={(e) => e.key === 'Enter' && handleTrackClick(track, idx, showTracks.tracks)}
              >
                <span className="track-idx">{idx + 1}</span>
                {(track.thumbnail || track.image_url) && (
                  <img src={track.thumbnail || track.image_url} alt="" className="track-thumb" />
                )}
                <div className="track-info">
                  <span className="track-title">{track.title}</span>
                  <span className="track-artist">{track.artist}</span>
                </div>
                <span className="track-status">
                  {currentTrack?._id === track._id && isPlaying ? '▶' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaylistSelector;
