import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AvailabilityChecker from '../components/Movies/AvailabilityChecker';
import RedirectButton from '../components/Movies/RedirectButton';
import MovieGrid from '../components/Movies/MovieGrid';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [updatingWatchlist, setUpdatingWatchlist] = useState(false);
  
  // Theater Player states
  const [playing, setPlaying] = useState(false);
  const [activeServer, setActiveServer] = useState('vidsrc');

  // Fetch movie details
  const fetchMovieDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/movies/${id}`);
      const json = await res.json();
      if (json.data) {
        setMovie(json.data);
        // Also fetch recommendations for similar genres
        fetchSimilarRecommendations(json.data.genres || []);
      } else {
        setMovie(null);
      }
    } catch (err) {
      console.error('Error fetching movie details:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch similar movies based on current movie's genres
  const fetchSimilarRecommendations = async (genres) => {
    try {
      const params = new URLSearchParams();
      if (user?._id) {
        params.append('userId', user._id);
      }
      const res = await fetch(`${API}/api/movies/recommendations?${params.toString()}`);
      const json = await res.json();
      // Filter out the current movie
      const filtered = (json.data || []).filter(
        (m) => m._id !== id && m.title !== movie?.title
      );
      setRecommendations(filtered.slice(0, 4));
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  };

  // Check if movie is favorited
  const checkFavoriteStatus = useCallback(async () => {
    if (!user?._id || !id) return;
    try {
      const res = await fetch(`${API}/api/movies/favorites/${user._id}`);
      const json = await res.json();
      const isFav = (json.data || []).some(
        (fav) => fav.movieId === id || (fav.movieId && fav.movieId._id === id)
      );
      setIsFavorited(isFav);
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  }, [user?._id, id]);

  // Check watchlist status
  const checkWatchlistStatus = useCallback(async () => {
    if (!user?._id || !id) return;
    try {
      const res = await fetch(`${API}/api/movies/watchlist/${user._id}`);
      const json = await res.json();
      const watchItem = (json.data || []).find(
        (item) => item.movieId === id || (item.movieId && item.movieId._id === id)
      );
      if (watchItem) {
        setWatchlistStatus(watchItem.status);
        setProgress(watchItem.progress || 0);
      } else {
        setWatchlistStatus('');
        setProgress(0);
      }
    } catch (err) {
      console.error('Error checking watchlist status:', err);
    }
  }, [user?._id, id]);

  useEffect(() => {
    if (user?._id) {
      fetchMovieDetail();
      checkFavoriteStatus();
      checkWatchlistStatus();
    }
  }, [id, user?._id, fetchMovieDetail, checkFavoriteStatus, checkWatchlistStatus]);

  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!user?._id || !movie) return;
    try {
      const res = await fetch(`${API}/api/movies/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          movieId: movie._id || id,
          title: movie.title,
          posterUrl: movie.posterUrl,
        }),
      });
      const json = await res.json();
      if (json.status === 'added') {
        setIsFavorited(true);
      } else if (json.status === 'removed') {
        setIsFavorited(false);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Update watchlist
  const handleUpdateWatchlist = async (status, currentProgress) => {
    if (!user?._id || !movie) return;
    setUpdatingWatchlist(true);
    try {
      const res = await fetch(`${API}/api/movies/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          movieId: movie._id || id,
          status,
          progress: currentProgress,
          title: movie.title,
          posterUrl: movie.posterUrl,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setWatchlistStatus(status);
        setProgress(currentProgress);
      }
    } catch (err) {
      console.error('Error updating watchlist:', err);
    } finally {
      setUpdatingWatchlist(false);
    }
  };

  const getServerUrl = () => {
    if (!movie) return '';
    const imdb = movie.imdbId || 'tt0133093';
    if (activeServer === 'superembed') {
      return `https://multiembed.eu/?video_id=${imdb}`;
    }
    if (activeServer === 'embedsu') {
      return `https://embed.su/embed/movie/${imdb}`;
    }
    return `https://vidsrc.to/embed/movie/${imdb}`;
  };

  if (loading) {
    return (
      <div className="movie-detail-loading-screen">
        <div className="spinner"></div>
        <p>Streaming cinematic metadata...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="movie-detail-error-screen">
        <span className="error-icon">🎬</span>
        <h2>Movie Not Found</h2>
        <p>The cinematic record could not be loaded.</p>
        <button className="back-btn-glow" onClick={() => navigate('/movies')}>
          Back to Movies Hub
        </button>
      </div>
    );
  }

  return (
    <div className="movie-detail-container">
      {/* Banner Backdrop */}
      <div
        className="movie-detail-backdrop"
        style={{
          backgroundImage: movie.backdropUrl
            ? `radial-gradient(circle, rgba(8, 8, 10, 0.4) 0%, rgba(8, 8, 10, 0.95) 90%), url(${movie.backdropUrl})`
            : 'none',
        }}
      >
        <button className="movie-detail-back-arrow" onClick={() => navigate('/movies')}>
          ← Back to Hub
        </button>
      </div>

      <div className="movie-detail-content-wrapper">
        
        {/* Inline Theater Player block */}
        {playing && (
          <div className="detail-theater-player-block glass-panel">
            <div className="player-block-header">
              <div className="playing-title-meta">
                <span className="movie-icon-indicator">🍿</span>
                <div>
                  <h3>Now Playing: {movie.title}</h3>
                  <p className="playing-server-status">Direct Bypass stream — Server: {activeServer === 'vidsrc' ? 'Server 1' : activeServer === 'superembed' ? 'Server 2' : 'Server 3'}</p>
                </div>
              </div>
              <button className="player-block-close-btn" onClick={() => setPlaying(false)}>✕ Close Player</button>
            </div>
            
            <div className="player-iframe-wrapper">
              <iframe
                src={getServerUrl()}
                title={`Bypass Stream Player - ${movie.title}`}
                className="detail-player-iframe"
                allowFullScreen
                scrolling="no"
                allow="autoplay; encrypted-media; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
              />
            </div>
            
            <div className="player-block-footer">
              <div className="server-selectors-block-netflix">
                <span className="server-block-label">Select Bypass Server:</span>
                <div className="server-buttons-group">
                  <button
                    className={`server-btn-netflix ${activeServer === 'vidsrc' ? 'active' : ''}`}
                    onClick={() => setActiveServer('vidsrc')}
                  >
                    🚀 Server 1 (VidSrc)
                  </button>
                  <button
                    className={`server-btn-netflix ${activeServer === 'superembed' ? 'active' : ''}`}
                    onClick={() => setActiveServer('superembed')}
                  >
                    ⚡ Server 2 (SuperEmbed)
                  </button>
                  <button
                    className={`server-btn-netflix ${activeServer === 'embedsu' ? 'active' : ''}`}
                    onClick={() => setActiveServer('embedsu')}
                  >
                    🌌 Server 3 (Embed.su)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Poster & Main Meta */}
        <div className="movie-detail-primary-grid">
          <div className="movie-detail-poster-column">
            <div className="poster-glow-frame">
              {movie.posterUrl ? (
                <img src={movie.posterUrl} alt={movie.title} className="detail-poster-img" />
              ) : (
                <div className="no-poster-detail">🍿</div>
              )}
            </div>

            {/* Favorite, Play & Watchlist Interactions */}
            <div className="detail-actions-panel glass-panel">
              <button
                className="netflix-play-btn-detail"
                onClick={() => { setPlaying(true); window.scrollTo({ top: 150, behavior: 'smooth' }); }}
              >
                ▶ Play Movie (Bypass Ads)
              </button>

              <button
                className={`favorite-action-btn ${isFavorited ? 'active' : ''}`}
                onClick={handleToggleFavorite}
              >
                <span className="heart-icon">{isFavorited ? '❤️' : '🤍'}</span>
                {isFavorited ? 'Favorited' : 'Add to Favorites'}
              </button>

              <div className="watchlist-control-block">
                <label className="watchlist-label">Watch Status</label>
                <select
                  className="watchlist-status-select"
                  value={watchlistStatus}
                  onChange={(e) => handleUpdateWatchlist(e.target.value, e.target.value === 'completed' ? 100 : progress)}
                  disabled={updatingWatchlist}
                >
                  <option value="">Not Tracking</option>
                  <option value="watching">Watching</option>
                  <option value="plan_to_watch">Plan to Watch</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {watchlistStatus && watchlistStatus !== 'completed' && (
                <div className="watchlist-progress-slider-block">
                  <div className="slider-meta">
                    <span>Progress: {progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="watchlist-progress-slider"
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                    onMouseUp={(e) => handleUpdateWatchlist(watchlistStatus, parseInt(e.target.value))}
                    onTouchEnd={(e) => handleUpdateWatchlist(watchlistStatus, parseInt(e.target.value))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Info Details Column */}
          <div className="movie-detail-info-column">
            <div className="movie-detail-title-block">
              <h1 className="detail-movie-title">{movie.title}</h1>
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <p className="detail-original-title">Original: {movie.originalTitle}</p>
              )}
              <div className="detail-meta-row">
                {movie.releaseYear && <span className="meta-badge-item">{movie.releaseYear}</span>}
                {movie.runtime && <span className="meta-badge-item">{movie.runtime} min</span>}
                {movie.rating && (
                  <span className="meta-badge-item gold-badge">
                    ★ {movie.rating.toFixed(1)} Rating
                  </span>
                )}
              </div>
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className="detail-genres-row">
                {movie.genres.map((genre, idx) => (
                  <span key={idx} className="genre-badge">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            <div className="detail-synopsis-section glass-panel">
              <h3 className="section-subtitle">Synopsis</h3>
              <p className="synopsis-text">{movie.synopsis || 'No synopsis record available.'}</p>
            </div>

            <div className="detail-crew-section glass-panel">
              {movie.director && (
                <div className="crew-item">
                  <span className="crew-role">Director</span>
                  <span className="crew-name">{movie.director}</span>
                </div>
              )}
              {movie.cast && movie.cast.length > 0 && (
                <div className="crew-item">
                  <span className="crew-role">Cast</span>
                  <span className="crew-name">{movie.cast.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Checkers & Redirects */}
            <div className="detail-integrations-grid">
              <AvailabilityChecker availability={movie.streamingAvailability || []} />
              <RedirectButton movieTitle={movie.title} redirectLinks={movie.redirectLinks || []} />
            </div>
          </div>
        </div>

        {/* Similar Recommendations Section */}
        {recommendations.length > 0 && (
          <section className="detail-recommendations-section">
            <h2 className="recommendations-heading">🎬 Similar Recommendations</h2>
            <MovieGrid movies={recommendations} />
          </section>
        )}
      </div>
    </div>
  );
}

export default MovieDetail;
