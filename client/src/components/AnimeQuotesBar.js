import React, { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL;

function AnimeQuotesBar() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchQuote = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API}/api/quotes/random`);
      const data = await res.json();
      if (data.quote) {
        setQuote(data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQuote();
    const interval = setInterval(fetchQuote, 90000);
    return () => clearInterval(interval);
  }, [fetchQuote]);

  const getSourceBadge = () => {
    if (!quote?.source) return '';
    const badges = { animechan: 'AnimeChan', database: 'Quotes DB', fallback: 'Classic' };
    return badges[quote.source] || '';
  };

  return (
    <div className={`anime-quotes-bar ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded(!expanded)}>
      <span className="anime-quotes-icon">{loading ? '⏳' : error ? '💬' : '💬'}</span>
      <div className="anime-quotes-text-wrap">
        {loading ? (
          <span className="anime-quotes-text loading">Finding inspiration...</span>
        ) : quote ? (
          <>
            <span className="anime-quotes-text">
              &ldquo;{quote.quote}&rdquo;
            </span>
            <span className="anime-quotes-attribution">
              &mdash; {quote.character ? <strong>{quote.character}</strong> : 'Unknown'}
              {quote.anime ? <span className="anime-quotes-anime"> from <em>{quote.anime}</em></span> : ''}
              {getSourceBadge() && <span className="anime-quotes-source">{getSourceBadge()}</span>}
            </span>
          </>
        ) : (
          <span className="anime-quotes-text">&ldquo;The secret of getting ahead is getting started.&rdquo; &mdash; <strong>Mark Twain</strong></span>
        )}
      </div>
      <button
        className="anime-quotes-refresh"
        onClick={(e) => { e.stopPropagation(); fetchQuote(); }}
        disabled={loading}
        title="New Quote"
      >
        {loading ? '...' : '🔄'}
      </button>
    </div>
  );
}

export default AnimeQuotesBar;
