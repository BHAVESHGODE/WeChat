import React, { useState, useEffect, useRef, useCallback } from 'react';

const COLORS = ['#ff4757', '#ffa502', '#2ed573', '#1e90ff'];
const COLOR_LABELS = ['Red', 'Orange', 'Green', 'Blue'];

function SimonSays({ userId, onScore }) {
  const [seq, setSeq] = useState([]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [phase, setPhase] = useState('start'); // start | show | input | win | lose
  const [activeColor, setActiveColor] = useState(null);
  const [score, setScore] = useState(0);
  const timerRef = useRef(null);

  const startGame = useCallback(() => {
    const first = [Math.floor(Math.random() * 4)];
    setSeq(first);
    setPlayerIdx(0);
    setPhase('show');
    setScore(0);
  }, []);

  useEffect(() => {
    if (phase !== 'show' || !seq.length) return;
    let i = 0;
    const showNext = () => {
      if (i >= seq.length) { setPhase('input'); return; }
      setActiveColor(seq[i]);
      timerRef.current = setTimeout(() => { setActiveColor(null); i++; timerRef.current = setTimeout(showNext, 300); }, 500);
    };
    timerRef.current = setTimeout(showNext, 400);
    return () => clearTimeout(timerRef.current);
  }, [phase, seq]);

  const handleClick = (colorIdx) => {
    if (phase !== 'input') return;
    if (colorIdx !== seq[playerIdx]) {
      setPhase('lose');
      return;
    }
    const next = playerIdx + 1;
    if (next >= seq.length) {
      setScore(s => s + 1);
      setSeq(prev => [...prev, Math.floor(Math.random() * 4)]);
      setPlayerIdx(0);
      setPhase('show');
      if (onScore) onScore(1);
    } else {
      setPlayerIdx(next);
    }
  };

  return (
    <div className="game-inner">
      <h3 className="game-name">Simon Says</h3>
      {phase === 'start' && <p className="game-status">Remember the sequence!</p>}
      {phase === 'lose' && <p className="game-status">Wrong! Score: {score}</p>}
      {phase === 'input' && <p className="game-status">Your turn! ({playerIdx + 1}/{seq.length})</p>}
      {phase === 'show' && seq.length > 0 && <p className="game-status">Watch... ({seq.length} steps)</p>}
      {score > 0 && <p className="game-substatus">Score: {score}</p>}
      <div className="simon-grid">
        {COLORS.map((c, i) => (
          <button key={i} className={`simon-btn ${activeColor === i ? 'simon-active' : ''}`}
            style={{ background: activeColor === i ? c : `${c}66`, boxShadow: activeColor === i ? `0 0 30px ${c}` : 'none' }}
            onClick={() => handleClick(i)} disabled={phase !== 'input'}>
            {COLOR_LABELS[i]}
          </button>
        ))}
      </div>
      {(phase === 'start' || phase === 'lose') && <button className="game-reset-btn" onClick={startGame}>{phase === 'start' ? '▶ Start' : '↺ Try Again'}</button>}
    </div>
  );
}

export default SimonSays;
