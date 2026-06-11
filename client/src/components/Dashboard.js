import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DashboardHub.css';

const BIRTHDAY_API = process.env.REACT_APP_API_URL + '/api/birthday/check';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'ti ti-layout-dashboard', id: 'dashboard' },
  { label: 'Library', icon: 'ti ti-books', id: 'library' },
  { label: 'Anime', icon: 'ti ti-video', id: 'anime' },
  { label: 'Music', icon: 'ti ti-music', id: 'music' },
  { label: 'Games', icon: 'ti ti-device-gamepad-2', id: 'games' },
  { label: 'Study', icon: 'ti ti-pencil', id: 'study' },
  { label: 'Settings', icon: 'ti ti-settings', id: 'settings' },
];

const DASHBOARD_TILES = [
  { label: 'Study Zone', icon: 'ti ti-pencil', path: '/study-zone', cls: 'tile-study' },
  { label: 'Music', icon: 'ti ti-music', path: '/music', cls: 'tile-music' },
  { label: 'YouTube', icon: 'ti ti-brand-youtube', path: '/youtube', cls: 'tile-youtube' },
  { label: 'Chat Hub', icon: 'ti ti-message', path: '/chalo-baat-karte-hai', cls: 'tile-chat' },
  { label: 'Games', icon: 'ti ti-device-gamepad-2', path: '/games', cls: 'tile-games' },
  { label: 'Anime Hub', icon: 'ti ti-video', path: '/anime-hub', cls: 'tile-animehub' },
  { label: 'Watch Anime', icon: 'ti ti-player-play', path: '/anime-hub/watch', cls: 'tile-watch' },
  { label: 'Manga Zone', icon: 'ti ti-book', path: '/anime-hub/manga', cls: 'tile-manga' },
  { label: 'Tracking', icon: 'ti ti-chart-bar', path: '/anime-hub/tracking', cls: 'tile-tracking' },
  { label: 'Books', icon: 'ti ti-books', path: '/books', cls: 'tile-books' },
  { label: 'Movies', icon: 'ti ti-movie', path: '/movies', cls: 'tile-movies' },
  { label: 'Birthday', icon: 'ti ti-star', path: '/goju/birthday', cls: 'tile-birthday' },
];

const NOTIFICATIONS = [
  { icon: 'ti ti-bell', text: 'New anime episode available', time: '2m ago' },
  { icon: 'ti ti-music', text: 'Your playlist updated', time: '15m ago' },
  { icon: 'ti ti-book', text: 'Book recommendation ready', time: '1h ago' },
  { icon: 'ti ti-game', text: 'New game added', time: '3h ago' },
  { icon: 'ti ti-star', text: 'Maverick completed a milestone', time: '5h ago' },
];

const MOBILE_NAV = [
  { label: 'Home', icon: 'ti ti-home', path: '' },
  { label: 'Anime', icon: 'ti ti-video', path: '/anime-hub' },
  { label: 'Music', icon: 'ti ti-music', path: '/music' },
  { label: 'Games', icon: 'ti ti-device-gamepad-2', path: '/games' },
  { label: 'Study', icon: 'ti ti-pencil', path: '/study-zone' },
];

function createParticles() {
  const particles = [];
  for (let i = 0; i < 30; i++) {
    particles.push({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 10,
    });
  }
  return particles;
}

function Dashboard({ name, accent, data, onBack }) {
  const navigate = useNavigate();
  const [birthday, setBirthday] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeNav, setActiveNav] = useState('dashboard');
  const [loaded, setLoaded] = useState(false);
  const [particles] = useState(createParticles);
  const gridRef = useRef(null);

  useEffect(() => {
    fetch(`${BIRTHDAY_API}/${name}`)
      .then((r) => r.json())
      .then((d) => { if (d.isBirthday) setBirthday(d); })
      .catch(() => {});
    const timer = setTimeout(() => setLoaded(true), 400);
    return () => clearTimeout(timer);
  }, [name]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleRipple = useCallback((e) => {
    const tile = e.currentTarget;
    const rect = tile.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'hub-ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
    ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
    tile.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }, []);

  const filteredTiles = DASHBOARD_TILES.filter((t) =>
    t.label.toLowerCase().includes(search.toLowerCase())
  );

  const userSince = data?.user?.createdAt
    ? new Date(data.user.createdAt).toLocaleDateString()
    : 'N/A';

  return (
    <div className="hub-container">
      {/* Animated Background */}
      <div className="hub-bg-canvas">
        {particles.map((p) => (
          <div
            key={p.id}
            className="hub-particle"
            style={{
              left: p.left + '%',
              width: p.size + 'px',
              height: p.size + 'px',
              animationDuration: p.duration + 's',
              animationDelay: p.delay + 's',
            }}
          />
        ))}
      </div>


      {/* Sidebar */}
      <aside className="hub-sidebar" role="navigation" aria-label="Main navigation">
        <div className="hub-sidebar-logo">WeGift</div>
        <nav className="hub-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`hub-sidebar-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
              aria-current={activeNav === item.id ? 'page' : undefined}
              aria-label={item.label}
            >
              <i className={item.icon} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="hub-sidebar-footer">
          <button className="hub-sidebar-item" onClick={onBack} aria-label="Go back">
            <i className="ti ti-arrow-left" aria-hidden="true" />
            <span>Back</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="hub-main" role="main">
        <div className="hub-main-scroll">
          {/* Header */}
          <header className="hub-header">
            <div className="hub-greeting">
              <h1>Welcome {name}!{birthday ? ' 🎂' : ''}</h1>
              <p>Your personalized hub is ready</p>
            </div>

            <div className="hub-header-right">
              <div className="hub-search" role="search">
                <i className="ti ti-search" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search tiles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search dashboard tiles"
                />
              </div>

              <button
                className="hub-quick-btn"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              >
                <i className={`ti ti-${theme === 'dark' ? 'sun' : 'moon'}`} />
              </button>

              <button
                className="hub-quick-btn"
                onClick={() => setNotifOpen(true)}
                aria-label="Open notifications"
              >
                <i className="ti ti-bell" />
                <span className="badge">3</span>
              </button>

              <div
                className="hub-profile-card"
                onClick={() => setModalOpen(true)}
                tabIndex={0}
                role="button"
                aria-label="View profile"
                onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
              >
                <div
                  className="hub-avatar hub-avatar-ring"
                  style={{
                    background: `linear-gradient(135deg, ${accent || '#ff00cc'}, ${accent || '#00ffff'})`,
                  }}
                  aria-hidden="true"
                >
                  {name.charAt(0)}
                </div>
                <div className="hub-profile-info">
                  <span className="hub-profile-name">{name}</span>
                  <span className="hub-profile-role">{data?.user?.role || 'Pioneer'}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard Grid */}
          <div className="hub-grid" ref={gridRef} role="grid" aria-label="Dashboard tiles">
            {filteredTiles.map((tile, idx) => (
              <div
                key={tile.label}
                className={`hub-tile ${tile.cls} ${!loaded ? 'hub-tile-loading' : ''}`}
                style={{ animationDelay: (idx * 0.05) + 's', animation: loaded ? `fadeInUp 0.5s ease ${idx * 0.05}s both` : 'none' }}
                onClick={(e) => {
                  handleRipple(e);
                  setTimeout(() => navigate(tile.path), 200);
                }}
                onKeyDown={(e) => e.key === 'Enter' && navigate(tile.path)}
                tabIndex={0}
                role="gridcell"
                aria-label={`Open ${tile.label}`}
              >
                <i className={`ti ${tile.icon}`} aria-hidden="true" />
                <span>{tile.label}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <footer className="hub-footer">
            <div className="hub-footer-meta">
              <span>WeGift v2.0</span>
              <span>&copy; 2026 MAVERICK (Bhavesh G)</span>
            </div>
          </footer>
        </div>
      </main>

      {/* Notification Drawer */}
      <div
        className={`hub-drawer-overlay ${notifOpen ? 'open' : ''}`}
        onClick={() => setNotifOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`hub-drawer ${notifOpen ? 'open' : ''}`}
        role="dialog"
        aria-label="Notifications"
      >
        <div className="hub-drawer-header">
          <h3>Notifications</h3>
          <button className="hub-drawer-close" onClick={() => setNotifOpen(false)} aria-label="Close notifications">
            <i className="ti ti-x" />
          </button>
        </div>
        {NOTIFICATIONS.map((n, i) => (
          <div key={i} className="hub-drawer-item">
            <div className="hub-drawer-item-icon">
              <i className={n.icon} />
            </div>
            <div className="hub-drawer-item-text">
              <p>{n.text}</p>
              <span>{n.time}</span>
            </div>
          </div>
        ))}
      </aside>

      {/* Profile Modal */}
      <div
        className={`hub-modal-overlay ${modalOpen ? 'open' : ''}`}
        onClick={() => setModalOpen(false)}
        aria-hidden="true"
      />
      <div
        className="hub-modal"
        role="dialog"
        aria-label="Profile"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: modalOpen ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.9)',
          zIndex: 201,
          opacity: modalOpen ? 1 : 0,
          pointerEvents: modalOpen ? 'all' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <h2>Profile</h2>
        <p>Welcome back, {name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--hub-glass)', borderRadius: 'var(--hub-radius-md)' }}>
          <div
            className="hub-avatar"
            style={{
              width: '52px',
              height: '52px',
              fontSize: '1.4rem',
              background: `linear-gradient(135deg, ${accent || '#ff00cc'}, ${accent || '#00ffff'})`,
            }}
          >
            {name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--hub-text-secondary)' }}>{data?.user?.role || 'Pioneer'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--hub-text-tertiary)' }}>Since {userSince}</div>
          </div>
        </div>
        <button className="hub-modal-btn" onClick={() => { setModalOpen(false); onBack(); }}>
          SIGN OUT
        </button>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="hub-mobile-nav" role="navigation" aria-label="Mobile navigation">
        {MOBILE_NAV.map((item) => (
          <button
            key={item.label}
            className={`hub-mobile-nav-item ${!item.path && !activeNav ? 'active' : ''}`}
            onClick={() => {
              if (item.path) navigate(item.path);
              else setActiveNav('dashboard');
            }}
            aria-label={item.label}
          >
            <i className={item.icon} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default Dashboard;
