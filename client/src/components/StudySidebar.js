import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SECTIONS = [
  { key: 'overview', label: 'Overview', icon: '📊', path: '/study-zone' },
  { key: 'tasks', label: 'Tasks', icon: '✅', path: '/study-zone/tasks' },
  { key: 'notes', label: 'Notes', icon: '📝', path: '/study-zone/notes' },
  { key: 'timer', label: 'Pomodoro', icon: '⏳', path: '/study-zone/timer' },
  { key: 'progress', label: 'Progress', icon: '🏆', path: '/study-zone/progress' },
];

function StudySidebar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const isActive = (key) => {
    if (key === 'overview') return path === '/study-zone';
    return path.includes(key);
  };

  return (
    <div className="sz-sidebar">
      <div className="sz-sidebar-logo" onClick={() => navigate(`/study-zone?user=${user}`)}>
        📚 Study Zone
      </div>
      <nav className="sz-sidebar-nav">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            className={`sz-sidebar-link ${isActive(s.key) ? 'active' : ''}`}
            onClick={() => navigate(`${s.path}?user=${user}`)}
          >
            <span className="sz-sidebar-icon">{s.icon}</span>
            <span className="sz-sidebar-label">{s.label}</span>
          </button>
        ))}
      </nav>
      <div className="sz-sidebar-divider" />
      <div className="sz-sidebar-section-label">Quick Links</div>
      <button className="sz-sidebar-link" onClick={() => navigate(`/music?user=${user}`)}>
        <span className="sz-sidebar-icon">🎵</span>
        <span className="sz-sidebar-label">Music</span>
      </button>
      <button className="sz-sidebar-link" onClick={() => navigate(`/music/ambient?user=${user}`)}>
        <span className="sz-sidebar-icon">🌿</span>
        <span className="sz-sidebar-label">Ambient</span>
      </button>
      <div className="sz-sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button className="sz-sidebar-back" onClick={() => navigate(`/${user.toLowerCase()}`)}>
          ← Dashboard
        </button>
        <button className="sz-sidebar-back" onClick={() => navigate('/')} style={{ background: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          🚪 Welcome Page
        </button>
      </div>
    </div>
  );
}

export default StudySidebar;
