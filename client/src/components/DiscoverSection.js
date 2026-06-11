import React, { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';

const API = process.env.REACT_APP_API_URL;

const SUGGESTIONS = [
  'Arijit Singh',
  'Pritam',
  'Lofi Beats',
  'A.R. Rahman',
  'Apna Bana Le',
  'Punjabi Hits'
];

const SearchIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem', flexShrink: 0 }}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

function DiscoverSection({ onPlay, playlists = [], onSaveToPlaylist, onAddToQueue, onNewPlaylist }) {
  const { currentTrack, autoplayVibe, setAutoplayVibe, recommendedTracks } = useMusic();
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('trending');

  useEffect(() => {
    fetchTrending();
  }, []);

  // Real-time search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setActiveTab('trending');
      return;
    }
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchTrending = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/music/trending?country=india&limit=20`);
      const data = await res.json();
      if (data.tracks) setTrending(data.tracks);
      else setError('Could not load trending');
    } catch {
      setError('Failed to load trending music');
    }
    setLoading(false);
  };

  const handleSearch = async (queryVal) => {
    const q = queryVal !== undefined ? queryVal : searchQuery;
    if (!q.trim()) return;
    setSearching(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/music/search?q=${encodeURIComponent(q)}&limit=15`);
      const data = await res.json();
      if (data.tracks) setSearchResults(data.tracks);
      else setSearchResults([]);
      setActiveTab('search');
    } catch {
      setError('Search failed');
    }
    setSearching(false);
  };

  const handlePlay = (track, tracks) => {
    if (onPlay) onPlay(track, tracks || []);
  };

  const [savingId, setSavingId] = useState(null);
  const handleSave = async (track, playlistId) => {
    if (!onSaveToPlaylist || !playlistId) return;
    setSavingId(track.trackId || track.url || track.title);
    await onSaveToPlaylist(track, playlistId);
    setSavingId(null);
  };

  return (
    <div className="discover-section">
      <div className="discover-search">
        <input
          type="text"
          placeholder="What do you want to play?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="discover-search-input"
        />
        {searchQuery && (
          <button className="discover-search-clear-btn" onClick={() => setSearchQuery('')} aria-label="Clear search">
            ✕
          </button>
        )}
        <button className="discover-search-btn" onClick={() => handleSearch()} disabled={searching}>
          {searching ? '...' : <SearchIcon size={18} color="#00e5ff" />}
        </button>
      </div>

      {/* Popular Search Suggestions (shown when query is empty) */}
      {searchQuery.trim() === '' && (
        <div className="discover-suggestions-box">
          <p className="discover-suggestions-title">💡 POPULAR SEARCHES</p>
          <div className="discover-suggestions-list">
            {SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                className="discover-suggestion-tag"
                onClick={() => {
                  setSearchQuery(tag);
                  handleSearch(tag);
                }}
              >
                <SearchIcon size={14} color="#00e5ff" />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vibe Recommendations Section (Autoplay Next) */}
      {searchQuery.trim() === '' && currentTrack && recommendedTracks && recommendedTracks.length > 0 && (
        <div className="discover-vibe-recommendations">
          <div className="discover-vibe-header">
            <h3 className="discover-vibe-title">✨ Recommended (Matches vibe of {currentTrack.title})</h3>
            <div className="autoplay-vibe-toggle-wrap">
              <span className="autoplay-vibe-label">Autoplay Vibe Match</span>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={autoplayVibe}
                  onChange={() => setAutoplayVibe(!autoplayVibe)}
                />
                <span className="toggle-track"><span className="toggle-thumb" /></span>
              </label>
            </div>
          </div>
          <div className="discover-grid animate-fade-in">
            {recommendedTracks.slice(0, 6).map((track, i) => (
              <div key={track.trackId || track.previewUrl || i} className="discover-card" onClick={() => handlePlay(track, recommendedTracks)}>
                {track.thumbnail && (
                  <img src={track.thumbnail} alt={track.title} className="discover-card-img" />
                )}
                <div className="discover-card-body">
                  <p className="discover-card-title">{track.title}</p>
                  <p className="discover-card-artist">{track.artist}</p>
                  {track.album && <p className="discover-card-album">{track.album}</p>}
                  <div className="discover-card-actions" onClick={(e) => e.stopPropagation()}>
                    {onAddToQueue && (
                      <button className="discover-action-btn" onClick={() => { onAddToQueue(track); }} title="Add to Queue">+Q</button>
                    )}
                    {playlists.length > 0 && onSaveToPlaylist && (
                      <>
                        <select className="discover-playlist-select" onChange={(e) => { if (e.target.value) handleSave(track, e.target.value); e.target.value = ''; }} defaultValue="">
                          <option value="" disabled>Save to...</option>
                          {playlists.map((pl) => (
                            <option key={pl._id} value={pl._id}>{pl.name}</option>
                          ))}
                        </select>
                        {savingId === (track.trackId || track.previewUrl || track.title) && <span className="discover-saved-msg">✓</span>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="discover-tabs">
        <button
          className={`discover-tab ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => setActiveTab('trending')}
        >
          🔥 Trending
        </button>
        <button
          className={`discover-tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Search Results
        </button>
      </div>

      {error && <p className="discover-error">{error}</p>}

      {activeTab === 'trending' && (
        <div className="discover-content">
          <h3 className="discover-title">Trending in India</h3>
          {loading ? (
            <p className="discover-loading">Loading trending...</p>
          ) : (
            <div className="discover-grid">
              {trending.map((track, i) => (
                <div key={track.url || i} className="discover-card" onClick={() => handlePlay(track, trending)}>
                  {track.thumbnail && (
                    <img src={track.thumbnail} alt={track.title} className="discover-card-img" />
                  )}
                  <div className="discover-card-body">
                    <p className="discover-card-title">{track.title}</p>
                    <p className="discover-card-artist">{track.artist}</p>
                    {track.listeners && (
                      <p className="discover-card-listeners">{track.listeners.toLocaleString()} listeners</p>
                    )}
                    <div className="discover-card-actions" onClick={(e) => e.stopPropagation()}>
                      {onAddToQueue && (
                        <button className="discover-action-btn" onClick={() => { onAddToQueue(track); }} title="Add to Queue">+Q</button>
                      )}
                      {playlists.length > 0 && onSaveToPlaylist && (
                        <>
                          <select className="discover-playlist-select" onChange={(e) => { if (e.target.value) handleSave(track, e.target.value); e.target.value = ''; }} defaultValue="">
                            <option value="" disabled>Save to...</option>
                            {playlists.map((pl) => (
                              <option key={pl._id} value={pl._id}>{pl.name}</option>
                            ))}
                          </select>
                          {savingId === (track.trackId || track.url || track.title) && <span className="discover-saved-msg">✓</span>}
                        </>
                      )}
                      {onNewPlaylist && (
                        <button className="discover-action-btn" onClick={() => onNewPlaylist()} title="New Playlist">+PL</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="discover-content">
          <h3 className="discover-title">Search Results</h3>
          {searchResults.length === 0 && searching ? (
            <p className="discover-loading">Searching...</p>
          ) : searchResults.length === 0 ? (
            <p className="discover-loading">No results found. Try another search query.</p>
          ) : (
            <div className="discover-grid">
              {searchResults.map((track, i) => (
                <div key={track.trackId || track.previewUrl || i} className="discover-card" onClick={() => handlePlay(track, searchResults)}>
                  {track.thumbnail && (
                    <img src={track.thumbnail} alt={track.title} className="discover-card-img" />
                  )}
                  <div className="discover-card-body">
                    <p className="discover-card-title">{track.title}</p>
                    <p className="discover-card-artist">{track.artist}</p>
                    {track.album && <p className="discover-card-album">{track.album}</p>}
                    {track.duration > 0 && (
                      <p className="discover-card-duration">
                        {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                      </p>
                    )}
                    <div className="discover-card-actions" onClick={(e) => e.stopPropagation()}>
                      {onAddToQueue && (
                        <button className="discover-action-btn" onClick={() => { onAddToQueue(track); }} title="Add to Queue">+Q</button>
                      )}
                      {playlists.length > 0 && onSaveToPlaylist && (
                        <>
                          <select className="discover-playlist-select" onChange={(e) => { if (e.target.value) handleSave(track, e.target.value); e.target.value = ''; }} defaultValue="">
                            <option value="" disabled>Save to...</option>
                            {playlists.map((pl) => (
                              <option key={pl._id} value={pl._id}>{pl.name}</option>
                            ))}
                          </select>
                          {savingId === (track.trackId || track.previewUrl || track.title) && <span className="discover-saved-msg">✓</span>}
                        </>
                      )}
                      {onNewPlaylist && (
                        <button className="discover-action-btn" onClick={() => onNewPlaylist()} title="New Playlist">+PL</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DiscoverSection;
