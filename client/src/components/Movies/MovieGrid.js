import React from 'react';
import MovieCard from './MovieCard';

function MovieGrid({ movies, emptyMessage = "No movies found." }) {
  if (!movies || movies.length === 0) {
    return (
      <div className="movie-grid-empty">
        <span className="empty-movie-icon">🍿</span>
        <p className="empty-movie-text">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="movie-grid-container">
      {movies.map((movie, index) => (
        <MovieCard key={movie._id || index} movie={movie} />
      ))}
    </div>
  );
}

export default MovieGrid;
