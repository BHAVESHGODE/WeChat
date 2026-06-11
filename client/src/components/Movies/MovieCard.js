import React from 'react';
import { useNavigate } from 'react-router-dom';

function MovieCard({ movie }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    const movieId = movie._id || encodeURIComponent(movie.title);
    navigate(`/movies/${movieId}`);
  };

  return (
    <div className="movie-card glass-panel" onClick={handleCardClick}>
      <div className="movie-poster-container">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="movie-poster"
            loading="lazy"
          />
        ) : (
          <div className="no-poster">
            <span className="no-poster-icon">🍿</span>
          </div>
        )}
        <div className="movie-rating-badge">
          <span className="rating-star">★</span> {movie.rating ? movie.rating.toFixed(1) : 'N/A'}
        </div>
      </div>
      <div className="movie-card-info">
        <h3 className="movie-card-title">{movie.title}</h3>
        <div className="movie-card-meta">
          <span className="movie-card-year">{movie.releaseYear || 'N/A'}</span>
          {movie.runtime && (
            <span className="movie-card-runtime">{movie.runtime} min</span>
          )}
        </div>
        {movie.genres && movie.genres.length > 0 && (
          <div className="movie-card-genres">
            {movie.genres.slice(0, 3).map((genre, idx) => (
              <span key={idx} className="movie-genre-tag">
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MovieCard;
