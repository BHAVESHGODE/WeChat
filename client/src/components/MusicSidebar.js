import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function MusicSidebar({ user, onNewPlaylist, isOpen, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const links = [
    { path: `/music?user=${user}`, label: '🏠 Home', tab: 'home' },
    { path: `/music/discover?user=${user}`, label: '🔍 Search', tab: 'discover' },
    { path: `/music/playlists?user=${user}`, label: '📋 Your Library', tab: 'playlists' },
    { path: `/study-zone?user=${user}`, label: '📚 Study Zone', tab: 'studyzone' },
    { path: `/music/adyoutube?user=${user}`, label: '▶ Ad-Free YouTube', tab: 'adyoutube' },
    { path: `/music/ambient?user=${user}`, label: '🌿 Ambient', tab: 'ambient' },
  ];

  const isActive = (tab) => {
    if (tab === 'home') return path === '/music';
    if (tab === 'studyzone') return path.includes('study-zone');
    return path.includes(tab);
  };

  const handleNav = (linkPath) => {
    navigate(linkPath);
    if (onToggle) onToggle();
  };

  return (
    <>
      <div className={`music-sidebar ${isOpen ? 'music-sidebar--open' : ''}`} role="navigation" aria-label="Music navigation">
        <div className="music-sidebar-logo" onClick={() => handleNav(`/music?user=${user}`)}>
          🎵 WeGift Music
        </div>
        <nav className="music-sidebar-nav">
          {links.map((link) => (
            <button
              key={link.tab}
              className={`music-sidebar-link ${isActive(link.tab) ? 'active' : ''}`}
              onClick={() => handleNav(link.path)}
              aria-current={isActive(link.tab) ? 'page' : undefined}
            >
              {link.label}
            </button>
          ))}
        </nav>
        <div className="music-sidebar-divider" />
        <div className="music-sidebar-section-label">Playlists</div>
        <button className="music-sidebar-new-btn" onClick={onNewPlaylist}>
          ➕ New Playlist
        </button>
        <div className="music-sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className="music-sidebar-back" onClick={() => handleNav(`/${user.toLowerCase()}`)}>
            ← Dashboard
          </button>
          <button className="music-sidebar-back" onClick={() => handleNav('/')} style={{ background: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
            🚪 Welcome Page
          </button>
        </div>
      </div>

      {isOpen && <div className="music-sidebar-overlay" onClick={onToggle} aria-label="Close menu" />}
    </>
  );
}

export default MusicSidebar;
