import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const CHEERFUL_VIDEO_ID = 'dQw4w9WgXcQ';

const CARD_DESIGNS = [
  { id: 'festive', label: '🎊 Festive', bg: 'linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77)' },
  { id: 'elegant', label: '✨ Elegant', bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  { id: 'playful', label: '🎈 Playful', bg: 'linear-gradient(135deg, #f093fb, #f5576c)' },
];

function BirthdayCelebration({ user, message, quote, cardDesigns, onDone }) {
  const navigate = useNavigate();
  const [cut, setCut] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [cakeSlices, setCakeSlices] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      audioRef.current = new window.YT.Player('birthday-audio', {
        height: '0', width: '0',
        videoId: CHEERFUL_VIDEO_ID,
        playerVars: { autoplay: 1, loop: 1, playlist: CHEERFUL_VIDEO_ID },
      });
    };

    return () => {
      if (audioRef.current) audioRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    if (showConfetti) {
      const t = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(t);
    }
  }, [showConfetti]);

  const cutCake = () => {
    if (cut) return;
    setCut(true);
    setShowConfetti(true);
    let slices = 0;
    const interval = setInterval(() => {
      slices++;
      setCakeSlices(slices);
      if (slices >= 5) clearInterval(interval);
    }, 300);
  };

  const currentDesign = CARD_DESIGNS[cardIndex % CARD_DESIGNS.length];
  const card = cardDesigns && cardDesigns.length > 0
    ? cardDesigns[cardIndex % cardDesigns.length]
    : currentDesign;

  return (
    <div className="birthday-page">
      <div id="birthday-audio" />

      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 80 }).map((_, i) => (
            <span key={i} className="confetti-piece" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              background: [`#ff6b6b`, `#ffd93d`, `#6bcb77`, `#4d96ff`, `#f093fb`][i % 5],
              width: `${6 + Math.random() * 8}px`,
              height: `${6 + Math.random() * 8}px`,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }} />
          ))}
        </div>
      )}

      {Array.from({ length: 12 }).map((_, i) => (
        <span key={`balloon-${i}`} className="birthday-balloon" style={{
          left: `${5 + (i * 8)}%`,
          animationDelay: `${i * 0.5}s`,
          fontSize: `${1.5 + Math.random() * 1.5}rem`,
        }}>
          {['🎈', '🎈', '🎈', '🎈', '🎈', '🎉', '🎊', '🎁', '🌟', '💫', '🎀', '✨'][i]}
        </span>
      ))}

      <button className="back-btn" onClick={() => navigate(`/${user.name.toLowerCase()}`)} style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10 }}>
        ← Dashboard
      </button>

      <div className="birthday-content">
        <h1 className="birthday-title">🎂 Happy Birthday, {user.name}! 🎂</h1>
        <p className="birthday-subtitle">{message}</p>

        <div className="birthday-cake-area">
          <div className={`birthday-cake ${cut ? 'cut' : ''}`} onClick={cutCake}>
            <div className="cake-plate" />
            <div className="cake-base">
              <div className="cake-frosting" />
              <div className="cake-filling" />
              <div className="cake-frosting-bottom" />
            </div>
            <div className="cake-candles">
              {!cut && Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="cake-candle" style={{ left: `${20 + i * 15}%`, animationDelay: `${i * 0.2}s` }}>
                  <span className="candle-flame" />🔥
                </span>
              ))}
            </div>
            {cut && (
              <div className="cake-slices">
                {Array.from({ length: cakeSlices }).map((_, i) => (
                  <div key={i} className="cake-slice" style={{ transform: `rotate(${i * 30}deg) translateY(-30px)` }}>🍰</div>
                ))}
              </div>
            )}
            <p className="cake-hint">{cut ? '🎉 Enjoy your cake!' : '👆 Click to cut the cake!'}</p>
          </div>
        </div>

        <div className="birthday-card-display" style={{ background: card.bg || currentDesign.bg }}>
          <div className="birthday-card-inner">
            <span className="birthday-card-emoji">{card.emoji || currentDesign.emoji}</span>
            <h2>Happy Birthday, {user.name}!</h2>
            <p className="birthday-card-role">{user.role}</p>
            <p className="birthday-card-quote">"{quote}"</p>
            <button className="birthday-card-flip" onClick={() => setCardIndex((i) => i + 1)}>
              🔄 Next Design
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BirthdayCelebration;
