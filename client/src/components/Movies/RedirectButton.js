import React from 'react';

function RedirectButton({ movieTitle, redirectLinks = [] }) {
  const dbSites = (redirectLinks || []).map(l => l.siteName.toLowerCase());

  const defaultLinks = [
    { siteName: 'VegaMovies', url: `https://vegamovies.pages.dev/search?q=${encodeURIComponent(movieTitle)}` },
    { siteName: 'HDHub4u', url: `https://hdhub4u.wtf/?s=${encodeURIComponent(movieTitle)}` },
    { siteName: '9xFlix', url: `https://9xflix.cymru/m/?s=${encodeURIComponent(movieTitle)}` },
    { siteName: 'iPagal', url: `http://ipagal.pokipro.com/?s=${encodeURIComponent(movieTitle)}` },
    { siteName: 'BollyFlix', url: `https://bollyflix.med/?s=${encodeURIComponent(movieTitle)}` }
  ];

  const links = [...(redirectLinks || [])];
  defaultLinks.forEach(dl => {
    if (!dbSites.includes(dl.siteName.toLowerCase())) {
      links.push(dl);
    }
  });

  return (
    <div className="redirect-links-panel glass-panel">
      <h4 className="redirect-title">🚀 Fast Stream Redirects</h4>
      <p className="redirect-description">
        Watch direct high-quality streams via external search providers.
      </p>
      <div className="redirect-buttons-container">
        {links.map((link, idx) => (
          <a
            key={idx}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="redirect-glow-button"
          >
            <span className="btn-icon">🍿</span>
            <span className="btn-text">Watch on {link.siteName}</span>
            <span className="btn-arrow">➔</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default RedirectButton;
