import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useMediaQuery from '../../hooks/useMediaQuery';

const NAV_ITEMS = [
  { section: 'Discover', items: [
    { path: '/maverick', label: 'Dashboard', icon: '🏠' },
    { path: '/study-room', label: 'Study Room', icon: '📚' },
  ]},
  { section: 'Entertainment', items: [
    { path: '/anime-hub', label: 'Anime Zone', icon: '🎬' },
    { path: '/anime-hub/manga', label: 'Manga Zone', icon: '📖' },
    { path: '/music', label: 'Music', icon: '🎵' },
    { path: '/youtube', label: 'YouTube', icon: '▶️' },
    { path: '/books', label: 'Books', icon: '📕' },
    { path: '/movies', label: 'Movies', icon: '🍿' },
  ]},
  { section: 'Social', items: [
    { path: '/chalo-baat-karte-hai', label: 'Chat Hub', icon: '💬' },
    { path: '/venting-room', label: 'Venting Room', icon: '🤗' },
    { path: '/games', label: 'Games', icon: '🎮' },
  ]},
  { section: 'Anime Tools', items: [
    { path: '/anime-hub/ghibli', label: 'Studio Ghibli', icon: '🏯' },
    { path: '/anime-hub/trace', label: 'Scene Search', icon: '🔍' },
    { path: '/anime-hub/favorites', label: 'Favorites', icon: '⭐' },
    { path: '/anime-hub/watchlist', label: 'Watchlist', icon: '📋' },
    { path: '/anime-hub/tracking', label: 'Tracking', icon: '📊' },
  ]},
];

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleNav = (path) => {
    navigate(path);
    if (isMobile) onClose();
  };

  return (
    <>
      {isMobile && isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo" onClick={() => handleNav('/maverick')}>
            <span className="sidebar-logo-icon">✨</span>
            <h2>WeGift</h2>
          </div>
          {isMobile && (
            <button className="sidebar-close-btn" onClick={onClose}>✕</button>
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((section) => (
            <div key={section.section} className="sidebar-section">
              <div className="sidebar-section-label">{section.section}</div>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <button
                    key={item.path}
                    className={`sidebar-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNav(item.path)}
                  >
                    <span className="sidebar-item-icon">{item.icon}</span>
                    <span className="sidebar-item-label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button className="sidebar-item" onClick={() => handleNav('/')} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}>
            <span className="sidebar-item-icon">🚪</span>
            <span className="sidebar-item-label">Welcome Page</span>
          </button>
          <div className="sidebar-version">v1.0.0</div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
