import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BOTTOM_NAV = [
  { path: '/maverick', label: 'Home', icon: '🏠' },
  { path: '/anime-hub', label: 'Anime', icon: '🎬' },
  { path: '/music', label: 'Music', icon: '🎵' },
  { path: '/youtube', label: 'YouTube', icon: '▶️' },
  { path: '/chalo-baat-karte-hai', label: 'Chat', icon: '💬' },
];

function MobileNav({ onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <button className="mobile-hamburger" onClick={onMenuClick}>☰</button>
      <nav className="mobile-bottom-nav">
        {BOTTOM_NAV.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="mobile-nav-icon">{item.icon}</span>
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

export default MobileNav;
