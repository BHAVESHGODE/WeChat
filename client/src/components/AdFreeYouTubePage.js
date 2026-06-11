import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdFreeYouTube from './AdFreeYouTube';
import '../styles/YouTubePremium.css';

function AdFreeYouTubePage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1rem' }}>
          ← Back
        </button>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Ad-Free YouTube</span>
      </div>
      <AdFreeYouTube />
    </div>
  );
}

export default AdFreeYouTubePage;
