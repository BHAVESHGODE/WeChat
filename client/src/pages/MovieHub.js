import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/Movies/MovieCard';
import '../styles/MovieHub.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function MovieHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse'); // browse, watchlist, favorites
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('IN');
  const [movies, setMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Spotlight featured movie
  const [spotlightMovie, setSpotlightMovie] = useState(null);
  
  // Player state
  const [activePlayerMovie, setActivePlayerMovie] = useState(null);
  const [activeServer, setActiveServer] = useState('vidsrc');

  // Carousel refs for scrolling
  const trendingRowRef = useRef(null);
  const recsRowRef = useRef(null);
  const scifiRowRef = useRef(null);
  const actionRowRef = useRef(null);
  const watchlistRowRef = useRef(null);
  const favoritesRowRef = useRef(null);

  // Redirect to login if user not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch browsing / popular movies
  const fetchMovies = useCallback(async (searchQuery = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }
      params.append('region', region);
      const res = await fetch(`${API}/api/movies/search?${params.toString()}`);
      const json = await res.json();
      const list = json.data || [];
      setMovies(list);
      
      // Set the spotlight featured movie if not searching
      if (!searchQuery.trim() && list.length > 0) {
        // Spotlight a highly rated one, e.g., Interstellar or Inception or Matrix
        const chosen = list.find(m => m.title === 'Interstellar') || list.find(m => m.title === 'The Matrix') || list[0];
        setSpotlightMovie(chosen);
      } else if (searchQuery.trim()) {
        setSpotlightMovie(null);
      }
    } catch (err) {
      console.error('Failed to fetch movies:', err);
    } finally {
      setLoading(false);
    }
  }, [region]);

  // Fetch recommendations based on favorite genres
  const fetchRecommendations = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await fetch(`${API}/api/movies/recommendations?userId=${user._id}`);
      const json = await res.json();
      setRecommendations(json.data || []);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  }, [user?._id]);

  // Fetch user favorites
  const fetchFavorites = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await fetch(`${API}/api/movies/favorites/${user._id}`);
      const json = await res.json();
      const favList = (json.data || []).map((fav) => fav.movieId || {
        _id: fav.movieId,
        title: fav.title,
        posterUrl: fav.posterUrl,
        rating: 7.5,
        genres: []
      });
      setFavorites(favList);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    }
  }, [user?._id]);

  // Fetch user watchlist
  const fetchWatchlist = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await fetch(`${API}/api/movies/watchlist/${user._id}`);
      const json = await res.json();
      setWatchlist(json.data || []);
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
    }
  }, [user?._id]);

  // Fetch data on mount & tab changes
  useEffect(() => {
    if (user?._id) {
      fetchMovies();
      fetchRecommendations();
      fetchFavorites();
      fetchWatchlist();
    }
  }, [user?._id, fetchMovies, fetchRecommendations, fetchFavorites, fetchWatchlist]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMovies(query);
  };

  const handleRegionChange = (newRegion) => {
    setRegion(newRegion);
  };

  // Re-trigger search when region changes
  useEffect(() => {
    fetchMovies(query);
  }, [region, fetchMovies]);

  // Scroll function for carousels
  const handleScroll = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -500 : 500;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Play direct stream player helper
  const handlePlayMovie = (movie) => {
    setActivePlayerMovie(movie);
    setActiveServer('vidsrc');
  };

  const getPlayerUrl = () => {
    if (!activePlayerMovie) return '';
    const id = activePlayerMovie.imdbId || 'tt0133093';
    if (activeServer === 'superembed') {
      return `https://multiembed.eu/?video_id=${id}`;
    }
    if (activeServer === 'embedsu') {
      return `https://embed.su/embed/movie/${id}`;
    }
    return `https://vidsrc.to/embed/movie/${id}`;
  };

  // Filter rows
  const scifiMovies = movies.filter(m => m.genres && m.genres.some(g => g.toLowerCase() === 'sci-fi'));
  const actionMovies = movies.filter(m => m.genres && m.genres.some(g => g.toLowerCase() === 'action'));

  return (
    <div className="movie-hub-container">
      {/* Sub Sidebar Navigation */}
      <nav className="movie-sub-sidebar">
        <div className="sidebar-brand-container">
          <span className="brand-logo">🍿</span>
          <h2 className="brand-title">WeGift Movies</h2>
        </div>
        <div className="sidebar-navigation-items">
          <button
            className={`sub-sidebar-nav-btn ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => { setActiveTab('browse'); setQuery(''); fetchMovies(); }}
          >
            <span className="btn-icon">🏠</span> Home
          </button>
          <button
            className={`sub-sidebar-nav-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('watchlist')}
          >
            <span className="btn-icon">📋</span> My Watchlist
          </button>
          <button
            className={`sub-sidebar-nav-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <span className="btn-icon">⭐</span> Favorites
          </button>
        </div>
        
        {activeTab === 'browse' && (
          <div className="sidebar-filter-section">
            <h4 className="filter-title">Streaming Region</h4>
            <div className="region-selector-block">
              {[
                { code: 'IN', label: 'India', flag: '🇮🇳' },
                { code: 'US', label: 'USA', flag: '🇺🇸' },
                { code: 'UK', label: 'UK', flag: '🇬🇧' }
              ].map((r) => (
                <button
                  key={r.code}
                  className={`region-select-btn ${region === r.code ? 'active' : ''}`}
                  onClick={() => handleRegionChange(r.code)}
                >
                  <span className="region-btn-flag">{r.flag}</span>
                  <span className="region-btn-label">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="sidebar-footer-back">
          <button className="sub-sidebar-back-btn" onClick={() => navigate(`/${user?.name?.toLowerCase() || 'maverick'}`)}>
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      {/* Main Netflix Clone Viewport */}
      <main className="movie-main-content">
        
        {/* Search Bar at Top Right */}
        <div className="movie-topbar-actions">
          <form className="movie-search-form-netflix" onSubmit={handleSearchSubmit}>
            <span className="search-icon-lens">🔍</span>
            <input
              type="text"
              className="movie-search-input-netflix"
              placeholder="Titles, genres, directors..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className="clear-search-btn" onClick={() => { setQuery(''); fetchMovies(); }}>✕</button>
            )}
          </form>
        </div>

        {activeTab === 'browse' && (
          <>
            {/* Spotlight Hero Banner */}
            {spotlightMovie && !query.trim() && (
              <div
                className="netflix-hero-banner"
                style={{
                  backgroundImage: `linear-gradient(to top, #08080a 0%, rgba(8, 8, 10, 0.4) 60%, rgba(8, 8, 10, 0.8) 100%), url(${spotlightMovie.backdropUrl})`
                }}
              >
                <div className="netflix-hero-content">
                  <h1 className="netflix-hero-title">{spotlightMovie.title}</h1>
                  <div className="netflix-hero-meta">
                    <span className="match-score">98% Match</span>
                    <span className="hero-meta-item">{spotlightMovie.releaseYear}</span>
                    <span className="hero-meta-item">{spotlightMovie.runtime}m</span>
                    <span className="rating-badge-gold">★ {spotlightMovie.rating}</span>
                  </div>
                  <p className="netflix-hero-synopsis">{spotlightMovie.synopsis}</p>
                  <div className="netflix-hero-buttons">
                    <button className="netflix-btn-play" onClick={() => handlePlayMovie(spotlightMovie)}>
                      <span className="btn-symbol">▶</span> Play Now
                    </button>
                    <button
                      className="netflix-btn-info"
                      onClick={() => navigate(`/movies/${spotlightMovie._id || spotlightMovie.title}`)}
                    >
                      <span className="btn-symbol">ⓘ</span> More Info
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* If searching or empty search */}
            {query.trim() ? (
              <section className="movie-search-results-section">
                <h2 className="row-category-title">Search Results</h2>
                {loading ? (
                  <div className="section-loading">Searching WeGift Catalog...</div>
                ) : movies.length === 0 ? (
                  <div className="movie-grid-empty">
                    <span className="empty-movie-icon">🍿</span>
                    <p className="empty-movie-text">No movie titles matched your search query. Try another keyword!</p>
                  </div>
                ) : (
                  <div className="movie-search-results-grid">
                    {movies.map((movie, idx) => (
                      <MovieCard key={movie._id || idx} movie={movie} />
                    ))}
                  </div>
                )}
              </section>
            ) : (
              /* Netflix Row Carousels */
              <div className="netflix-rows-container">
                
                {/* Row 1: Trending Now */}
                {movies.length > 0 && (
                  <div className="netflix-row">
                    <h3 className="row-category-title">Trending Now</h3>
                    <div className="carousel-wrapper">
                      <button className="carousel-control left" onClick={() => handleScroll(trendingRowRef, 'left')}>‹</button>
                      <div className="carousel-track" ref={trendingRowRef}>
                        {movies.map((movie, idx) => (
                          <div key={movie._id || idx} className="carousel-card-item">
                            <MovieCard movie={movie} />
                          </div>
                        ))}
                      </div>
                      <button className="carousel-control right" onClick={() => handleScroll(trendingRowRef, 'right')}>›</button>
                    </div>
                  </div>
                )}

                {/* Row 2: Recommended (personalized row) */}
                {recommendations.length > 0 && (
                  <div className="netflix-row">
                    <h3 className="row-category-title">Recommended for {user?.name || 'You'}</h3>
                    <div className="carousel-wrapper">
                      <button className="carousel-control left" onClick={() => handleScroll(recsRowRef, 'left')}>‹</button>
                      <div className="carousel-track" ref={recsRowRef}>
                        {recommendations.map((movie, idx) => (
                          <div key={movie._id || idx} className="carousel-card-item">
                            <MovieCard movie={movie} />
                          </div>
                        ))}
                      </div>
                      <button className="carousel-control right" onClick={() => handleScroll(recsRowRef, 'right')}>›</button>
                    </div>
                  </div>
                )}

                {/* Row 3: Sci-Fi blockbusters */}
                {scifiMovies.length > 0 && (
                  <div className="netflix-row">
                    <h3 className="row-category-title">Sci-Fi & Cyberpunk</h3>
                    <div className="carousel-wrapper">
                      <button className="carousel-control left" onClick={() => handleScroll(scifiRowRef, 'left')}>‹</button>
                      <div className="carousel-track" ref={scifiRowRef}>
                        {scifiMovies.map((movie, idx) => (
                          <div key={movie._id || idx} className="carousel-card-item">
                            <MovieCard movie={movie} />
                          </div>
                        ))}
                      </div>
                      <button className="carousel-control right" onClick={() => handleScroll(scifiRowRef, 'right')}>›</button>
                    </div>
                  </div>
                )}

                {/* Row 4: Action */}
                {actionMovies.length > 0 && (
                  <div className="netflix-row">
                    <h3 className="row-category-title">Action Thrillers</h3>
                    <div className="carousel-wrapper">
                      <button className="carousel-control left" onClick={() => handleScroll(actionRowRef, 'left')}>‹</button>
                      <div className="carousel-track" ref={actionRowRef}>
                        {actionMovies.map((movie, idx) => (
                          <div key={movie._id || idx} className="carousel-card-item">
                            <MovieCard movie={movie} />
                          </div>
                        ))}
                      </div>
                      <button className="carousel-control right" onClick={() => handleScroll(actionRowRef, 'right')}>›</button>
                    </div>
                  </div>
                )}

                {/* Row 5: Watchlist carousels */}
                {watchlist.length > 0 && (
                  <div className="netflix-row">
                    <h3 className="row-category-title">Continue Watching</h3>
                    <div className="carousel-wrapper">
                      <button className="carousel-control left" onClick={() => handleScroll(watchlistRowRef, 'left')}>‹</button>
                      <div className="carousel-track" ref={watchlistRowRef}>
                        {watchlist.map((item, idx) => {
                          const movieObj = item.movieId || {
                            _id: item.movieId,
                            title: item.title,
                            posterUrl: item.posterUrl,
                            genres: [],
                            rating: 7.5
                          };
                          return (
                            <div key={item._id || idx} className="carousel-card-item watchlist-carousel-card" onClick={() => navigate(`/movies/${movieObj._id || encodeURIComponent(movieObj.title)}`)}>
                              <div className="watchlist-slide-content">
                                <img src={movieObj.posterUrl} alt={movieObj.title} className="slide-watchlist-poster" />
                                <div className="slide-watchlist-progress">
                                  <div className="slide-progress-fill" style={{ width: `${item.progress || 0}%` }} />
                                </div>
                                <div className="slide-watchlist-overlay">
                                  <span>{movieObj.title} ({item.progress || 0}%)</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button className="carousel-control right" onClick={() => handleScroll(watchlistRowRef, 'right')}>›</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <div className="tab-contents-netflix">
            <header className="movie-section-header">
              <h1 className="page-heading-title">My Watchlist</h1>
              <p className="page-sub-title">Tracks details, progress, and external direct streaming records.</p>
            </header>

            {watchlist.length === 0 ? (
              <div className="movie-grid-empty">
                <span className="empty-movie-icon">📋</span>
                <p className="empty-movie-text">No movies in your watchlist yet. Browse titles to add them!</p>
              </div>
            ) : (
              <div className="netflix-rows-container">
                {['watching', 'plan_to_watch', 'completed'].map((status) => {
                  const filtered = watchlist.filter(item => item.status === status);
                  if (filtered.length === 0) return null;

                  const titleMap = {
                    watching: '🍿 Currently Watching',
                    plan_to_watch: '⏳ Plan to Watch',
                    completed: '✅ Completed'
                  };

                  return (
                    <div key={status} className="netflix-row">
                      <h3 className="row-category-title">{titleMap[status]}</h3>
                      <div className="movie-search-results-grid">
                        {filtered.map((item, idx) => {
                          const movieObj = item.movieId || {
                            _id: item.movieId,
                            title: item.title,
                            posterUrl: item.posterUrl,
                            genres: [],
                            rating: 7.5
                          };
                          return <MovieCard key={item._id || idx} movie={movieObj} />;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="tab-contents-netflix">
            <header className="movie-section-header">
              <h1 className="page-heading-title">My Favorites</h1>
              <p className="page-sub-title">Movies you marked as legendary.</p>
            </header>

            {favorites.length === 0 ? (
              <div className="movie-grid-empty">
                <span className="empty-movie-icon">⭐</span>
                <p className="empty-movie-text">No favorites added yet. Explore and star your favorite movies!</p>
              </div>
            ) : (
              <div className="movie-search-results-grid">
                {favorites.map((movie, idx) => (
                  <MovieCard key={movie._id || idx} movie={movie} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Inline Theater Mode Ad-Free Streaming Video Player Overlay */}
      {activePlayerMovie && (
        <div className="theater-mode-modal-overlay">
          <div className="theater-player-modal-box glass-panel">
            <div className="theater-player-modal-header">
              <div className="playing-title-details">
                <span className="movie-icon-indicator">🎬</span>
                <div>
                  <h3 className="theater-modal-movie-title">{activePlayerMovie.title}</h3>
                  <p className="theater-modal-subtitle">Direct, Ad-Free Stream Bypass Player</p>
                </div>
              </div>
              <button className="theater-modal-close-btn" onClick={() => setActivePlayerMovie(null)}>✕</button>
            </div>
            
            {/* Direct Bypass Iframe Player */}
            <div className="theater-player-iframe-frame">
              <iframe
                src={getPlayerUrl()}
                title={`Bypass Stream - ${activePlayerMovie.title}`}
                className="theater-iframe"
                allowFullScreen
                scrolling="no"
                allow="autoplay; encrypted-media; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
              />
            </div>

            {/* Server Selector Bar */}
            <div className="theater-player-modal-footer">
              <div className="server-selectors-block-netflix">
                <span className="server-block-label">Select Direct Stream Server:</span>
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
              <div className="theater-modal-disclaimer">
                Note: These bypass streams block standard redirection overlays and direct ads automatically. Change server if loading fails.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MovieHub;
