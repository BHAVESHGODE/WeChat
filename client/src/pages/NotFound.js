import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '80vh', padding: '2rem', textAlign: 'center',
    }}>
      <span style={{ fontSize: '5rem', marginBottom: '0.5rem', opacity: 0.3 }}>🔮</span>
      <h1 style={{
        fontSize: '6rem', fontWeight: 900, margin: '0',
        background: 'linear-gradient(135deg, #7c4dff, #43e97b)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>404</h1>
      <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', maxWidth: '400px' }}>
        This page doesn't exist. Maybe it went on an adventure without telling anyone.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '0.7rem 1.6rem', border: 'none', borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c4dff, #43e97b)', color: '#fff',
            fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Go Home
        </button>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '0.7rem 1.6rem', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)',
            fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

export default NotFound;
