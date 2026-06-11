import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ratingColor } from '../../utils/formatters';

function AnimeCard({ anime, type = 'anime' }) {
  const navigate = useNavigate();
  const id = anime.malId || anime.id || anime.mal_id;
  const title = anime.title || anime.title_english || 'Untitled';
  const image = anime.imageUrl || anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
  const score = anime.score || anime.rating || anime.mean;
  const year = anime.year || anime.aired?.from?.slice(0, 4);
  const episodes = anime.episodes || anime.episodeCount;
  const genres = anime.genres || [];
  const source = type === 'manga' ? '/anime-hub/manga/' : '/anime/';

  return (
    <div className="anime-card" onClick={() => navigate(`${source}${id}`)}>
      <div className="card-image">
        {image && <img src={image} alt={title} loading="lazy" />}
        <div className="card-overlay">
          <button
            className="card-action-btn"
            onClick={(e) => { e.stopPropagation(); navigate(`${source}${id}`); }}
            title="View Details"
          >👁</button>
        </div>
        {score && <div className="card-score" style={{ color: ratingColor(score) }}>★ {score}</div>}
      </div>
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <div className="card-meta">
          {year && <span className="badge">{year}</span>}
          {episodes && <span className="badge">{episodes} ep</span>}
          {type === 'manga' && anime.chapters && <span className="badge">{anime.chapters} ch</span>}
        </div>
        {genres.length > 0 && (
          <div className="card-genres">
            {genres.slice(0, 3).map((g) => (
              <span key={g.malId || g.id || g.name || g} className="genre-tag">
                {g.name || g}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnimeCard;
