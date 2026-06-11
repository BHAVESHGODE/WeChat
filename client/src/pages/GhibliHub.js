import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AnimeHub.css';

const API = process.env.REACT_APP_API_URL;

function GhibliHub() {
  const navigate = useNavigate();
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [people, setPeople] = useState([]);
  const [locations, setLocations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [activeSection, setActiveSection] = useState('films');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [filmsRes, peopleRes, locRes, vehRes] = await Promise.all([
          fetch(`${API}/api/ghibli/films`),
          fetch(`${API}/api/ghibli/people`),
          fetch(`${API}/api/ghibli/locations`),
          fetch(`${API}/api/ghibli/vehicles`),
        ]);
        const [filmsData, peopleData, locData, vehData] = await Promise.all([
          filmsRes.json(), peopleRes.json(), locRes.json(), vehRes.json(),
        ]);
        setFilms(filmsData || []);
        setPeople(peopleData || []);
        setLocations(locData || []);
        setVehicles(vehData || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const getFilmPeople = (filmId) => people.filter((p) => p.films?.some((f) => f === filmId));
  const getFilmLocations = (filmId) => locations.filter((l) => l.films?.some((f) => f === filmId));
  const getFilmVehicles = (filmId) => vehicles.filter((v) => v.films?.some((f) => f === filmId));

  const navLinks = [
    { path: '/anime-hub', label: 'Anime Zone', icon: '🎬' },
    { path: '/anime-hub/manga', label: 'Manga Zone', icon: '📖' },
    { path: '/anime-hub/ghibli', label: 'Ghibli', icon: '🏰', active: true },
    { path: '/anime-hub/trace', label: 'Scene Search', icon: '🔎' },
    { path: '/anime-hub/favorites', label: 'Favorites', icon: '❤️' },
    { path: '/anime-hub/watchlist', label: 'My List', icon: '📋' },
  ];

  return (
    <div className="anime-hub">
      <nav className="anime-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🏰</span>
          <h2>Ghibli</h2>
        </div>
        <div className="sidebar-nav">
          {navLinks.map((link) => (
            <button key={link.path} className={`sidebar-nav-btn ${link.active ? 'active' : ''}`} onClick={() => navigate(link.path)}>
              <span>{link.icon}</span> {link.label}
            </button>
          ))}
        </div>
        <div className="sidebar-divider" />
        <div className="sidebar-tabs">
          <button className={`sidebar-tab ${activeSection === 'films' ? 'active' : ''}`} onClick={() => setActiveSection('films')}><span>🎬</span> Films</button>
          <button className={`sidebar-tab ${activeSection === 'people' ? 'active' : ''}`} onClick={() => setActiveSection('people')}><span>👥</span> People ({people.length})</button>
          <button className={`sidebar-tab ${activeSection === 'locations' ? 'active' : ''}`} onClick={() => setActiveSection('locations')}><span>📍</span> Locations ({locations.length})</button>
          <button className={`sidebar-tab ${activeSection === 'vehicles' ? 'active' : ''}`} onClick={() => setActiveSection('vehicles')}><span>🚗</span> Vehicles ({vehicles.length})</button>
        </div>
      </nav>

      <main className="anime-content">
        <header className="anime-header">
          <h1 className="page-title">
            {activeSection === 'films' ? 'Studio Ghibli Films' :
             activeSection === 'people' ? 'Characters & People' :
             activeSection === 'locations' ? 'Locations' : 'Vehicles'}
          </h1>
        </header>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /><p>Entering the Ghibli world...</p></div>
        ) : activeSection === 'films' ? (
          <div className="anime-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {films.map((film) => (
              <div key={film.id} className="anime-card glass" onClick={() => setSelectedFilm(film)}>
                <div className="card-image" style={{ paddingTop: '56%' }}>
                  <img src={film.image || film.movie_banner || 'https://via.placeholder.com/600x338'} alt={film.title} loading="lazy" />
                  <div className="card-overlay" style={{ justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                    <span style={{ padding: '0.3rem 0.6rem', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', color: '#ffd700', fontSize: '0.85rem', fontWeight: 700 }}>⭐ {film.rt_score}</span>
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{film.title}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem' }}>{film.original_title} ({film.original_title_romanised})</div>
                  <div className="card-meta">
                    <span className="badge">{film.director}</span>
                    <span className="badge">{film.release_date}</span>
                    <span className="badge">{film.running_time} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeSection === 'people' ? (
          <div className="anime-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {people.map((p) => (
              <div key={p.id} className="anime-card glass" style={{ cursor: 'default' }}>
                <div className="card-body" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
                  <div className="card-title">{p.name}</div>
                  {p.age && <span className="badge">Age: {p.age}</span>}
                  {p.gender && <span className="badge">{p.gender}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : activeSection === 'locations' ? (
          <div className="anime-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {locations.map((l) => (
              <div key={l.id} className="anime-card glass" style={{ cursor: 'default' }}>
                <div className="card-body" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📍</div>
                  <div className="card-title">{l.name}</div>
                  {l.climate && <span className="badge">{l.climate}</span>}
                  {l.terrain && <span className="badge">{l.terrain}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="anime-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {vehicles.map((v) => (
              <div key={v.id} className="anime-card glass" style={{ cursor: 'default' }}>
                <div className="card-body" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚗</div>
                  <div className="card-title">{v.name}</div>
                  {v.vehicle_class && <span className="badge">{v.vehicle_class}</span>}
                  {v.length && <span className="badge">{v.length}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedFilm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => setSelectedFilm(null)}>
            <div className="glass" style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 0 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ position: 'relative' }}>
                <img src={selectedFilm.movie_banner || selectedFilm.image || 'https://via.placeholder.com/700x394'} alt={selectedFilm.title} style={{ width: '100%', display: 'block', borderRadius: '14px 14px 0 0' }} />
                <button onClick={() => setSelectedFilm(null)} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h2 style={{ color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>{selectedFilm.title}</h2>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '1rem' }}>{selectedFilm.original_title} ({selectedFilm.original_title_romanised})</div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1rem' }}>{selectedFilm.description}</p>
                <div className="card-meta" style={{ marginBottom: '1rem' }}>
                  <span className="badge" style={{ fontSize: '0.8rem', padding: '0.25rem 0.7rem' }}>🎬 {selectedFilm.director}</span>
                  <span className="badge" style={{ fontSize: '0.8rem', padding: '0.25rem 0.7rem' }}>🎥 {selectedFilm.producer}</span>
                  <span className="badge" style={{ fontSize: '0.8rem', padding: '0.25rem 0.7rem' }}>📅 {selectedFilm.release_date}</span>
                  <span className="badge" style={{ fontSize: '0.8rem', padding: '0.25rem 0.7rem' }}>⭐ {selectedFilm.rt_score}</span>
                  <span className="badge" style={{ fontSize: '0.8rem', padding: '0.25rem 0.7rem' }}>⏱ {selectedFilm.running_time} min</span>
                </div>
                {getFilmPeople(selectedFilm.id).length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', margin: '0 0 0.5rem' }}>People</h4>
                    <div className="card-genres">{getFilmPeople(selectedFilm.id).map((p) => (<span key={p.id} className="genre-tag" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>{p.name}</span>))}</div>
                  </div>
                )}
                {getFilmLocations(selectedFilm.id).length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', margin: '0 0 0.5rem' }}>Locations</h4>
                    <div className="card-genres">{getFilmLocations(selectedFilm.id).map((l) => (<span key={l.id} className="genre-tag" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(67,233,123,0.1)', color: 'var(--manga-accent)' }}>{l.name}</span>))}</div>
                  </div>
                )}
                {getFilmVehicles(selectedFilm.id).length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', margin: '0 0 0.5rem' }}>Vehicles</h4>
                    <div className="card-genres">{getFilmVehicles(selectedFilm.id).map((v) => (<span key={v.id} className="genre-tag" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(255,107,157,0.1)', color: 'var(--anime-accent)' }}>{v.name}</span>))}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default GhibliHub;
