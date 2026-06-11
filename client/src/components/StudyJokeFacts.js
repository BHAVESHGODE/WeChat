import React, { useState, useEffect } from 'react';

const JOKE_GRADIENTS = [
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
];

function StudyJokeFacts() {
  const [joke, setJoke] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradient] = useState(() => JOKE_GRADIENTS[Math.floor(Math.random() * JOKE_GRADIENTS.length)]);

  const fetchJoke = () => {
    setLoading(true);
    fetch('https://official-joke-api.appspot.com/random_joke')
      .then((r) => r.json())
      .then((data) => {
        if (data.setup && data.punchline) {
          setJoke({ setup: data.setup, punchline: data.punchline });
        }
      })
      .catch(() => {
        fetch('https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist&type=twopart')
          .then((r) => r.json())
          .then((data) => {
            if (data.setup && data.delivery) {
              setJoke({ setup: data.setup, punchline: data.delivery });
            }
          })
          .catch(() => {
            setJoke({ setup: 'Why do programmers prefer dark mode?', punchline: 'Because light attracts bugs!' });
          });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJoke();
  }, []);

  return (
    <div className="sz-quote-card glass-card" style={{ background: gradient }}>
      <div className="sz-quote-overlay" />
      <div className="sz-quote-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="sz-quote-icon">😂</span>
          <button
            onClick={fetchJoke}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px',
              color: '#fff', padding: '0.25rem 0.6rem', fontSize: '0.72rem',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
            disabled={loading}
          >
            {loading ? '...' : 'Next →'}
          </button>
        </div>
        {loading ? (
          <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Loading...</p>
        ) : joke ? (
          <>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '0.3rem' }}>{joke.setup}</p>
            <p style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.9, fontStyle: 'italic' }}>{joke.punchline}</p>
          </>
        ) : (
          <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Could not load joke. Try again!</p>
        )}
      </div>
    </div>
  );
}

export default StudyJokeFacts;
