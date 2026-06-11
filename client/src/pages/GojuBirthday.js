import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const BIRTHDAY_SONG_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3';

const CONFETTI_COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#f093fb', '#c77dff', '#ff8fab', '#fb6f92'];

const PAGE_NAMES = ['Intro', 'Cake', 'Card', 'Collage', 'Blessing', 'Letter', 'Memories', 'Wishes', 'Finale'];

/* ---------- Helpers ---------- */
function createConfetti(container, count = 80) {
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span');
    piece.className = 'gb-confetti-piece';
    piece.style.cssText = `
      left:${Math.random() * 100}%;
      animation-delay:${Math.random() * 2}s;
      animation-duration:${2 + Math.random() * 3}s;
      background:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};
      width:${6 + Math.random() * 8}px;
      height:${6 + Math.random() * 8}px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      opacity:${0.7 + Math.random() * 0.3};
    `;
    container.appendChild(piece);
  }
  setTimeout(() => { while (container.firstChild) container.removeChild(container.firstChild); }, 5000);
}

function createSparkles(container, count = 30) {
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'gb-sparkle';
    s.style.cssText = `
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      width:${2 + Math.random() * 4}px;
      height:${2 + Math.random() * 4}px;
      animation-delay:${Math.random() * 3}s;
      animation-duration:${1.5 + Math.random() * 2}s;
      background:${['#ffd700', '#e0aaff', '#ffb3c6', '#fff3b0'][i % 4]};
    `;
    container.appendChild(s);
  }
}

function createBalloons(container, count = 14) {
  const emojis = ['🎈', '🎈', '🎈', '🎈', '🎉', '🎊', '🎁', '🌟', '💫', '🎀', '✨', '🎈', '🎈', '🎈'];
  for (let i = 0; i < count; i++) {
    const balloon = document.createElement('span');
    balloon.className = 'gb-balloon';
    balloon.textContent = emojis[i % emojis.length];
    balloon.style.cssText = `
      left:${2 + (i * 7) % 96}%;
      animation-delay:${i * 0.35}s;
      animation-duration:${5 + Math.random() * 5}s;
      font-size:${1.4 + Math.random() * 1.4}rem;
    `;
    container.appendChild(balloon);
  }
}

const FIREWORK_PALETTES = [
  ['#ff6b6b', '#ffd700', '#ff10b0', '#c77dff', '#43e97b', '#4d96ff', '#ff8fab'],
  ['#ffd700', '#fff3b0', '#ffb3c6', '#e0aaff', '#ff8fab', '#fb6f92', '#ff10b0'],
  ['#43e97b', '#4d96ff', '#c77dff', '#ffd700', '#ff6b6b', '#00d4ff', '#a855f7'],
  ['#ffd700', '#ff10b0', '#4d96ff', '#ff6b6b', '#43e97b', '#c77dff', '#ff8fab'],
];

function createFireworks(container, count = 5) {
  for (let b = 0; b < count; b++) {
    const burst = document.createElement('div');
    burst.className = 'gb-firework-burst';
    const cx = 10 + Math.random() * 80;
    const cy = 5 + Math.random() * 65;
    const palette = FIREWORK_PALETTES[b % FIREWORK_PALETTES.length];
    const particleCount = 16 + Math.floor(Math.random() * 16);
    const burstType = Math.random();
    burst.style.cssText = `left:${cx}%;top:${cy}%;animation-delay:${b * 0.35}s;`;
    for (let p = 0; p < particleCount; p++) {
      const dot = document.createElement('span');
      dot.className = 'gb-firework-dot';
      const angle = (p / particleCount) * 360 + (Math.random() - 0.5) * 20;
      const dist = burstType > 0.6
        ? 30 + Math.random() * 80
        : burstType > 0.3
          ? 50 + Math.random() * 50
          : 20 + Math.random() * 40;
      const color = palette[p % palette.length];
      const size = burstType > 0.6
        ? 2 + Math.random() * 4
        : 3 + Math.random() * 5;
      const delay = b * 0.35 + (burstType > 0.5 ? Math.random() * 0.15 : 0);
      const duration = 0.8 + Math.random() * 0.6;
      dot.style.cssText = `
        --fw-angle:${angle}deg;
        --fw-dist:${dist}px;
        background:${color};
        width:${size}px;
        height:${size}px;
        animation-delay:${delay}s;
        animation-duration:${duration}s;
        ${burstType > 0.7 ? `box-shadow:0 0 ${2 + size}px ${color};` : ''}
      `;
      burst.appendChild(dot);
    }
    container.appendChild(burst);
  }
  setTimeout(() => { while (container.firstChild) container.removeChild(container.firstChild); }, 5000);
}

/* ---------- BTS / Anime decorative shapes ---------- */
function BtsSilhouettes() {
  return (
    <div className="gb-bts-layer" aria-hidden="true">
      <span className="gb-bts-shape gb-bts-s1">🎵</span>
      <span className="gb-bts-shape gb-bts-s2">💜</span>
      <span className="gb-bts-shape gb-bts-s3">🎧</span>
      <span className="gb-bts-shape gb-bts-s4">⭐</span>
      <span className="gb-bts-shape gb-bts-s5">🎤</span>
      <span className="gb-bts-shape gb-bts-s6">💜</span>
      <div className="gb-bts-silhouette gb-bts-fig1" />
      <div className="gb-bts-silhouette gb-bts-fig2" />
      <div className="gb-bts-silhouette gb-bts-fig3" />
    </div>
  );
}

function AnimePartyDecor() {
  return (
    <div className="gb-anime-party" aria-hidden="true">
      <span className="gb-ap-star gb-ap-s1">⭐</span>
      <span className="gb-ap-star gb-ap-s2">🌟</span>
      <span className="gb-ap-star gb-ap-s3">✨</span>
      <span className="gb-ap-star gb-ap-s4">💫</span>
      <span className="gb-ap-star gb-ap-s5">🎊</span>
      <span className="gb-ap-ribbon gb-ap-r1">🎀</span>
      <span className="gb-ap-ribbon gb-ap-r2">🎀</span>
      <div className="gb-ap-streamer gb-ap-st1" />
      <div className="gb-ap-streamer gb-ap-st2" />
      <div className="gb-ap-streamer gb-ap-st3" />
    </div>
  );
}

/* =============================================
   PAGE 1 – INTRO
   ============================================= */
function BirthdayIntro({ onNext }) {
  const confettiRef = useRef(null);
  const balloonRef = useRef(null);
  const sparkleRef = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!shown) {
      createConfetti(confettiRef.current, 90);
      createBalloons(balloonRef.current, 14);
      createSparkles(sparkleRef.current, 30);
      setShown(true);
    }
  }, [shown]);

  return (
    <div className="gb-slide gb-intro">
      <BtsSilhouettes />
      <div ref={confettiRef} className="gb-confetti-layer" />
      <div ref={balloonRef} className="gb-balloon-layer" />
      <div ref={sparkleRef} className="gb-sparkle-layer" />
      <div className="gb-intro-badge">🎂</div>
      <h1 className="gb-intro-title">
        <span className="gb-title-line">Happy Birthday</span>
        <span className="gb-title-name neon-glow">Goju</span>
      </h1>
      <p className="gb-intro-sub">Celebrate this special day with joy, love, and light ✨</p>
      <div className="gb-intro-ornament">
        <span>✦</span><span>✧</span><span>✦</span>
      </div>
      <button className="gb-cta-btn" onClick={onNext}>
        Begin Celebration
        <span className="gb-cta-arrow">→</span>
      </button>
      <div className="gb-scroll-hint">Swipe or tap →</div>
    </div>
  );
}

/* =============================================
   PAGE 2 – CAKE CUTTING
   ============================================= */
function CakeCutting({ onNext }) {
  const confettiRef = useRef(null);
  const [cut, setCut] = useState(false);
  const [slices, setSlices] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  const handleCut = () => {
    if (cut) return;
    setCut(true);
    createConfetti(confettiRef.current, 100);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setSlices(count);
      if (count >= 6) {
        clearInterval(interval);
        setTimeout(() => setCelebrate(true), 400);
      }
    }, 350);
  };

  return (
    <div className="gb-slide gb-cake-page">
      <AnimePartyDecor />
      <div ref={confettiRef} className="gb-confetti-layer" />
      <div className="gb-cake-content">
        <h2 className="gb-section-title">Time for Cake!</h2>
        <p className="gb-section-sub">Tap the cake to cut it open</p>
        <div className={`gb-cake-wrapper ${cut ? 'gb-cake-cut' : ''}`} onClick={handleCut}>
          <div className="gb-cake-plate" />
          <div className="gb-cake-body">
            <div className="gb-cake-layer gb-cake-bottom" />
            <div className="gb-cake-filling" />
            <div className="gb-cake-layer gb-cake-top" />
            <div className="gb-cake-frosting" />
            <div className="gb-cake-drip" />
          </div>
          <div className="gb-cake-candles">
            {!cut && [0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="gb-candle" style={{ left: `${18 + i * 16}%`, animationDelay: `${i * 0.15}s` }}>
                <div className="gb-flame" />
                <div className="gb-flame-glow" />
              </div>
            ))}
            {cut && <div className="gb-smoke-puff" />}
          </div>
          {cut && slices > 0 && (
            <div className="gb-slice-container">
              {Array.from({ length: slices }).map((_, i) => (
                <div key={i} className="gb-slice" style={{ transform: `rotate(${i * 20 - 40}deg) translateY(-${20 + i * 8}px)` }}>🍰</div>
              ))}
            </div>
          )}
        </div>
        <p className="gb-cake-hint">
          {!cut ? '👆 Tap to cut!' : celebrate ? '🎉 Happy Birthday Goju! 🎉' : '✂️ Cutting...'}
        </p>
        {celebrate && (
          <div className="gb-celebrate-actions">
            <button className="gb-cta-btn" onClick={onNext}>Next: Greeting Card →</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* =============================================
   PAGE 3 – GREETING CARD
   ============================================= */
function GreetingCard({ onNext }) {
  const [flipped, setFlipped] = useState(false);
  const sparkleRef = useRef(null);

  useEffect(() => {
    if (!flipped) createSparkles(sparkleRef.current, 20);
  }, [flipped]);

  return (
    <div className="gb-slide gb-card-page">
      <div ref={sparkleRef} className="gb-sparkle-layer" />
      <div className="gb-card-rk-aura" aria-hidden="true">
        <div className="gb-rk-glow-ring" />
        <div className="gb-rk-glow-ring gb-rk-g2" />
        <div className="gb-rk-glow-ring gb-rk-g3" />
      </div>
      <div className="gb-card-content">
        <h2 className="gb-section-title">A Special Message</h2>
        <div className={`gb-flip-card ${flipped ? 'gb-flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
          <div className="gb-flip-inner">
            <div className="gb-flip-front">
              <div className="gb-card-front-deco">
                <span>⭐</span><span>💖</span><span>⭐</span>
              </div>
              <div className="gb-card-front-text">
                <span className="gb-front-line">Happy</span>
                <span className="gb-front-line">Birthday</span>
                <span className="gb-front-line gb-front-name neon-glow-sm">Goju</span>
              </div>
              <p className="gb-card-tap-hint">Tap to open ✨</p>
            </div>
            <div className="gb-flip-back">
              <div className="gb-card-back-deco">🪔</div>
              <p className="gb-blessing-text">May Radhe and Krishna bless you always with love, peace, and light.</p>
              <div className="gb-card-back-ornament">
                <span>🌸</span><span>🕉️</span><span>🌸</span>
              </div>
              <p className="gb-card-back-signature">With love, always 💫</p>
            </div>
          </div>
        </div>
        <p className="gb-card-hint">{flipped ? '💌 A blessing from the heart' : '👆 Tap the card to open'}</p>
        <button className="gb-cta-btn gb-cta-secondary" onClick={onNext}>Next: Memories →</button>
      </div>
    </div>
  );
}

/* =============================================
   PAGE 4 – COLLAGE FRAMES
   ============================================= */
const PHOTO_PLACEHOLDERS = [
  { label: 'Best Moment', emoji: '🌟' },
  { label: 'Happy Smile', emoji: '😊' },
  { label: 'Adventure', emoji: '🌍' },
  { label: 'With Friends', emoji: '🤝' },
  { label: 'Special Day', emoji: '🎉' },
  { label: 'Cherished', emoji: '💖' },
];

function CollageFrames({ onNext }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [entered, setEntered] = useState(false);
  const sparkleRef = useRef(null);

  useEffect(() => {
    if (!entered) { createSparkles(sparkleRef.current, 18); setEntered(true); }
  }, [entered]);

  return (
    <div className="gb-slide gb-collage-page">
      <div ref={sparkleRef} className="gb-sparkle-layer" />
      <div className="gb-collage-content">
        <h2 className="gb-section-title">Memories & Moments</h2>
        <p className="gb-section-sub">Photos to be added soon ✨</p>
        <div className="gb-polaroid-grid">
          {PHOTO_PLACEHOLDERS.map((item, i) => (
            <div key={i} className={`gb-polaroid ${hoveredIdx === i ? 'gb-polaroid-hovered' : ''}`}
              style={{ animationDelay: `${i * 0.1}s`, transform: `rotate(${(i - 2.5) * 3}deg)` }}
              onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
              <div className="gb-polaroid-image">
                <div className="gb-polaroid-placeholder">
                  <span className="gb-placeholder-emoji">{item.emoji}</span>
                  <span className="gb-placeholder-text">Add Photo</span>
                </div>
              </div>
              <div className="gb-polaroid-bts-badge" aria-hidden="true">💜</div>
              <div className="gb-polaroid-caption">{item.label}</div>
              {hoveredIdx === i && <div className="gb-polaroid-sparkle-burst" />}
            </div>
          ))}
        </div>
        <button className="gb-cta-btn gb-cta-secondary" onClick={onNext} style={{ marginTop: '0.5rem' }}>Next →</button>
      </div>
    </div>
  );
}

/* =============================================
   PAGE 5 – BLESSING PAGE
   ============================================= */
function BlessingPage() {
  const sparkleRef = useRef(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!entered) { createSparkles(sparkleRef.current, 35); setEntered(true); }
  }, [entered]);

  return (
    <div className="gb-slide gb-blessing-page">
      <div ref={sparkleRef} className="gb-sparkle-layer" />
      <div className="gb-blessing-aura" aria-hidden="true">
        <div className="gb-aura-ring gb-aura-outer" />
        <div className="gb-aura-ring gb-aura-mid" />
        <div className="gb-aura-ring gb-aura-inner" />
      </div>
      <div className="gb-blessing-rk-overlay" aria-hidden="true">
        <span className="gb-rk-peacock">🪶</span>
        <span className="gb-rk-flute">🪈</span>
        <span className="gb-rk-lotus">🪷</span>
      </div>
      <div className="gb-blessing-content">
        <div className="gb-blessing-symbols">
          <span className="gb-sym">🪔</span><span className="gb-sym gb-sym-main">🕉️</span><span className="gb-sym">🌸</span>
        </div>
        <h2 className="gb-blessing-title neon-glow">Radhe Radhe ✨</h2>
        <div className="gb-blessing-message">
          <p>May the divine light of Radhe and Krishna</p>
          <p>guide your path with love, peace, and joy.</p>
          <p className="gb-blessing-highlight">You are loved. You are cherished. You are blessed.</p>
        </div>
        <div className="gb-blessing-deco">
          <span>✦</span><span>✧</span><span>✦</span><span>✧</span><span>✦</span>
        </div>
        <p className="gb-final-text">Happy Birthday, Goju 🎂💖</p>
        <p className="gb-blessing-footer">With love from Wegift 💜</p>
      </div>
    </div>
  );
}

/* =============================================
   PAGE 6 – BIG BROTHER LETTER
   ============================================= */
function BigBrotherLetter({ onNext }) {
  const [revealed, setRevealed] = useState(false);
  const [paraIdx, setParaIdx] = useState(0);
  const sparkleRef = useRef(null);

  const paragraphs = [
    'To my dearest little sister Goju,',
    'On your special day, I want you to know just how much you mean to me. Watching you grow from a little girl into the incredible, strong, and beautiful person you are today has been the greatest privilege of my life. Every step you take, every dream you chase, every smile you share — it fills my heart with a pride words cannot capture.',
    'You have a light that is entirely your own. It shines in the way you care for others, in the strength you carry through every storm, and in the joy you bring to everyone lucky enough to know you. Never doubt for a single moment how capable you are. You can move mountains, little sister — I have always believed that.',
    'Life will bring its challenges, but remember this: you are never alone. I will always be right here, your biggest cheerleader, your shield on hard days, and your partner in every celebration. When you fall, I will help you rise. When you soar, I will be the loudest one cheering.',
    'So today, light every candle, make every wish, and embrace every moment of joy you deserve. This world is brighter, warmer, and more beautiful because you are in it. Thank you for being the amazing sister you are.',
    'Happy Birthday, Goju. I love you more than all the stars in the sky. Always and forever, Your Big Brother 💙',
  ];

  useEffect(() => {
    if (!revealed) {
      createSparkles(sparkleRef.current, 25);
      setRevealed(true);
    }
  }, [revealed]);

  useEffect(() => {
    if (paraIdx < paragraphs.length - 1) {
      const t = setTimeout(() => setParaIdx((i) => i + 1), 1800);
      return () => clearTimeout(t);
    }
  }, [paraIdx, paragraphs.length]);

  return (
    <div className="gb-slide gb-letter-page">
      <div ref={sparkleRef} className="gb-sparkle-layer" />
      <div className="gb-letter-ornament-top" aria-hidden="true">
        <span>💙</span><span>⭐</span><span>💙</span>
      </div>
      <div className="gb-letter-content">
        <h2 className="gb-section-title">A Letter From Your Big Brother 💙</h2>
        <div className="gb-letter-paper">
          <div className="gb-letter-lines" aria-hidden="true" />
          {paragraphs.slice(0, paraIdx + 1).map((p, i) => (
            <p key={i} className={`gb-letter-para ${i === paraIdx ? 'gb-para-entering' : 'gb-para-visible'}`}>
              {p}
            </p>
          ))}
          {paraIdx < paragraphs.length - 1 && (
            <div className="gb-letter-typing">
              <span className="gb-typing-dot" /><span className="gb-typing-dot" /><span className="gb-typing-dot" />
            </div>
          )}
        </div>
      </div>
      {paraIdx === paragraphs.length - 1 && (
        <button className="gb-cta-btn" onClick={onNext} style={{ marginTop: '0.5rem', zIndex: 5 }}>
          Next: Memory Lane →
        </button>
      )}
      <div className="gb-letter-ornament-bottom" aria-hidden="true">
        <span>💙</span><span>✨</span><span>💙</span>
      </div>
    </div>
  );
}

/* =============================================
   PAGE 7 – MEMORY LANE
   ============================================= */
const MEMORIES = [
  { icon: '🌟', text: 'Your smile lights up every room you walk into' },
  { icon: '💪', text: 'Your strength inspires everyone around you' },
  { icon: '💖', text: 'Your kindness touches every heart you meet' },
  { icon: '🎯', text: 'Your determination moves mountains' },
  { icon: '🎨', text: 'Your creativity knows no bounds' },
  { icon: '🌺', text: 'Your grace makes the world more beautiful' },
  { icon: '🔥', text: 'Your passion sets the sky ablaze' },
  { icon: '🕊️', text: 'Your spirit is free and boundless' },
];

function MemoryLane({ onNext }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const sparkleRef = useRef(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!entered) { createSparkles(sparkleRef.current, 20); setEntered(true); }
  }, [entered]);

  useEffect(() => {
    if (visibleCount < MEMORIES.length) {
      const t = setTimeout(() => setVisibleCount((c) => c + 1), 500);
      return () => clearTimeout(t);
    }
  }, [visibleCount]);

  return (
    <div className="gb-slide gb-memory-page">
      <div ref={sparkleRef} className="gb-sparkle-layer" />
      <div className="gb-memory-content">
        <h2 className="gb-section-title">A Walk Down Memory Lane 🌟</h2>
        <p className="gb-section-sub">Things that make you, you</p>
        <div className="gb-memory-timeline">
          <div className="gb-timeline-line" aria-hidden="true" />
          {MEMORIES.slice(0, visibleCount).map((m, i) => (
            <div key={i} className="gb-memory-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="gb-memory-dot" aria-hidden="true" />
              <div className="gb-memory-icon">{m.icon}</div>
              <div className="gb-memory-text">{m.text}</div>
            </div>
          ))}
          {visibleCount < MEMORIES.length && (
            <div className="gb-memory-pulse" aria-hidden="true" />
          )}
        </div>
      </div>
      {visibleCount === MEMORIES.length && (
        <button className="gb-cta-btn gb-cta-secondary" onClick={onNext} style={{ marginTop: '0.5rem', zIndex: 5 }}>
          Next: Make a Wish →
        </button>
      )}
    </div>
  );
}

/* =============================================
   PAGE 8 – WISH TREE
   ============================================= */
const WISHES = [
  'May your heart always find its home in joy ✨',
  'May every dream you hold gently bloom into reality 🌸',
  'May the stars always guide you through the darkest nights 🌟',
  'May love find you in every corner of this world 💖',
  'May your laughter echo through all the days to come 🎵',
  'May peace rest softly upon your soul always 🕊️',
  'May you always know you are enough, just as you are 💫',
  'May your story be written in gold across the sky 📖',
];

function WishTree({ onNext }) {
  const [revealedWishes, setRevealedWishes] = useState(0);
  const [entered, setEntered] = useState(false);
  const sparkleRef = useRef(null);

  useEffect(() => {
    if (!entered) { createSparkles(sparkleRef.current, 30); setEntered(true); }
  }, [entered]);

  useEffect(() => {
    if (revealedWishes < WISHES.length) {
      const t = setTimeout(() => setRevealedWishes((c) => c + 1), 700);
      return () => clearTimeout(t);
    }
  }, [revealedWishes]);

  return (
    <div className="gb-slide gb-wish-page">
      <div ref={sparkleRef} className="gb-sparkle-layer" />
      <div className="gb-wish-tree-bg" aria-hidden="true">
        <div className="gb-tree-trunk" />
        <div className="gb-tree-canopy">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="gb-tree-leaf" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
              width: `${6 + Math.random() * 8}px`,
              height: `${6 + Math.random() * 8}px`,
            }} />
          ))}
        </div>
      </div>
      <div className="gb-wish-content">
        <h2 className="gb-section-title">Wishes for You 🌟</h2>
        <p className="gb-section-sub">Each star carries a blessing — watch them light up</p>
        <div className="gb-wish-stars">
          {WISHES.slice(0, revealedWishes).map((w, i) => (
            <div key={i} className="gb-wish-star" style={{ animationDelay: `${i * 0.15}s` }}>
              <span className="gb-wish-icon">⭐</span>
              <span className="gb-wish-text">{w}</span>
            </div>
          ))}
          {revealedWishes < WISHES.length && (
            <div className="gb-wish-glowing" aria-hidden="true">✨</div>
          )}
        </div>
      </div>
      {revealedWishes === WISHES.length && (
        <button className="gb-cta-btn" onClick={onNext} style={{ marginTop: '0.5rem', zIndex: 5 }}>
          Grand Finale →
        </button>
      )}
    </div>
  );
}

/* =============================================
   PAGE 9 – FIREWORKS FINALE
   ============================================= */
function FireworksFinale() {
  const navigate = useNavigate();
  const fireworkRef = useRef(null);
  const confettiRef = useRef(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!entered) {
      createFireworks(fireworkRef.current, 8);
      createConfetti(confettiRef.current, 120);
      setEntered(true);
      const interval = setInterval(() => {
        createFireworks(fireworkRef.current, 3);
      }, 1500);
      const confInterval = setInterval(() => {
        createConfetti(confettiRef.current, 40);
      }, 2000);
      return () => { clearInterval(interval); clearInterval(confInterval); };
    }
  }, [entered]);

  return (
    <div className="gb-slide gb-finale-page">
      <div ref={fireworkRef} className="gb-firework-layer" />
      <div ref={confettiRef} className="gb-confetti-layer" />
      <div className="gb-finale-content">
        <div className="gb-finale-badge">🎂</div>
        <h1 className="gb-finale-title neon-glow">
          Happy Birthday<br />Goju! 🎉
        </h1>
        <div className="gb-finale-message">
          <p className="gb-finale-line">You are the most amazing sister in the world.</p>
          <p className="gb-finale-line">Never forget how special you are.</p>
          <p className="gb-finale-line">Shine bright, dream big, and know that</p>
          <p className="gb-finale-line">I will always be here for you.</p>
        </div>
        <div className="gb-finale-hearts" aria-hidden="true">
          {['💙', '💜', '💖', '💙', '💜', '💖'].map((h, i) => (
            <span key={i} className="gb-heart-float" style={{ animationDelay: `${i * 0.3}s`, left: `${5 + i * 16}%` }}>{h}</span>
          ))}
        </div>
        <p className="gb-finale-signature">With all my love, always and forever — Your Big Brother 💙</p>
        <p className="gb-finale-from">From Wegift with love 💜</p>
        <button className="gb-cta-btn" onClick={() => navigate('/goju')} style={{ marginTop: '0.5rem' }}>
          Back to Dashboard ←
        </button>
      </div>
    </div>
  );
}

/* =============================================
   MAIN — GojuBirthday
   ============================================= */
function GojuBirthday() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const audioRef = useRef(null);
  const touchStartX = useRef(0);

  const totalPages = 9;

  useEffect(() => {
    audioRef.current = new Audio(BIRTHDAY_SONG_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  const toggleMusic = useCallback(() => {
    if (!audioRef.current) return;
    if (musicPlaying) { audioRef.current.pause(); setMusicPlaying(false); }
    else { audioRef.current.play().then(() => { setMusicPlaying(true); setMusicStarted(true); }).catch(() => {}); }
  }, [musicPlaying]);

  useEffect(() => {
    const handler = () => {
      if (!musicStarted && audioRef.current) {
        audioRef.current.play().then(() => { setMusicPlaying(true); setMusicStarted(true); }).catch(() => {});
      }
    };
    document.addEventListener('click', handler, { once: true });
    return () => document.removeEventListener('click', handler);
  }, [musicStarted]);

  const goNext = useCallback(() => setCurrentPage((p) => Math.min(p + 1, totalPages - 1)), []);
  const goPrev = useCallback(() => setCurrentPage((p) => Math.max(p - 1, 0)), []);

  const handleTouchStart = useCallback((e) => { touchStartX.current = e.touches[0].clientX; }, []);
  const handleTouchEnd = useCallback((e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      if (diff > 0 && currentPage < totalPages - 1) goNext();
      else if (diff < 0 && currentPage > 0) goPrev();
    }
  }, [currentPage, goNext, goPrev]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
  }, [goNext, goPrev]);

  return (
    <div className="gb-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onKeyDown={handleKeyDown} tabIndex={0}>
      <button className="gb-back-btn" onClick={() => navigate('/goju')} aria-label="Back to dashboard">← Back</button>
      <div className="gb-slider-wrapper">
        <div className="gb-slider-track" style={{ transform: `translateX(-${currentPage * 100}%)` }}>
          <BirthdayIntro onNext={goNext} />
          <CakeCutting onNext={goNext} />
          <GreetingCard onNext={goNext} />
          <CollageFrames onNext={goNext} />
          <BlessingPage />
          <BigBrotherLetter onNext={goNext} />
          <MemoryLane onNext={goNext} />
          <WishTree onNext={goNext} />
          <FireworksFinale />
        </div>
      </div>
      <div className="gb-music-bar">
        <button className="gb-music-bar-btn" onClick={toggleMusic} aria-label="Toggle music">
          <span className="gb-music-icon">{musicPlaying ? '🔊' : '🔇'}</span>
          <span className="gb-music-label">{musicPlaying ? 'Happy Birthday ♪' : 'Tap to play'}</span>
          <span className={`gb-music-eq ${musicPlaying ? 'gb-eq-active' : ''}`}><span /><span /><span /></span>
        </button>
      </div>
      <div className="gb-nav-bar">
        <button className="gb-nav-arrow" onClick={goPrev} disabled={currentPage === 0} aria-label="Previous">‹</button>
        <div className="gb-dots">
          {PAGE_NAMES.map((name, i) => (
            <button key={i} className={`gb-dot ${i === currentPage ? 'gb-dot-active' : ''}`} onClick={() => setCurrentPage(i)} aria-label={`Go to ${name}`} />
          ))}
          <span className="gb-page-indicator">{currentPage + 1}/{totalPages}</span>
        </div>
        <button className="gb-nav-arrow" onClick={currentPage === totalPages - 1 ? () => navigate('/goju') : goNext} aria-label={currentPage === totalPages - 1 ? 'Finish' : 'Next'}>
          {currentPage === totalPages - 1 ? '✓' : '›'}
        </button>
      </div>
    </div>
  );
}

export default GojuBirthday;
