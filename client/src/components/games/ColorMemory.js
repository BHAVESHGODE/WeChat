import React, { useState, useEffect, useRef, useCallback } from 'react';

const COLORS = ['#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#a55eea', '#ff6b81', '#2bcbba', '#f7b731'];
const ROUND_TIME = 800;

function ColorMemory({ userId, onScore }) {
  const [seq, setSeq] = useState([]);
  const [inputIdx, setInputIdx] = useState(0);
  const [phase, setPhase] = useState('start');
  const [highlight, setHighlight] = useState(null);
  const [score, setScore] = useState(0);
  const timerRef = useRef(null);

  const startGame = useCallback(() => {
    const first = [Math.floor(Math.random() * 4)];
    setSeq(first);
    setInputIdx(0);
    setPhase('show');
    setScore(0);
  }, []);

  useEffect(() => {
    if (phase !== 'show' || !seq.length) return;
    let i = 0;
    const showNext = () => {
      if (i >= seq.length) { setPhase('input'); return; }
      setHighlight(seq[i]);
      timerRef.current = setTimeout(() => { setHighlight(null); i++; timerRef.current = setTimeout(showNext, 250); }, 500);
    };
    timerRef.current = setTimeout(showNext, 300);
    return () => clearTimeout(timerRef.current);
  }, [phase, seq]);

  const handleClick = (idx) => {
    if (phase !== 'input') return;
    if (idx !== seq[inputIdx]) {
      setPhase('lose');
      return;
    }
    const next = inputIdx + 1;
    if (next >= seq.length) {
      setScore(s => s + 1);
      setSeq(prev => [...prev, Math.floor(Math.random() * 8)]);
      setInputIdx(0);
      setPhase('show');
      if (onScore) onScore(1);
    } else {
      setInputIdx(next);
    }
  };

  return (
    <div className="game-inner">
      <h3 className="game-name">Color Memory</h3>
      {phase === 'start' && <p className="game-status">Watch the color sequence!</p>}
      {phase === 'lose' && <p className="game-status">Wrong! Score: {score}</p>}
      {phase === 'input' && <p className="game-status">Repeat! ({inputIdx + 1}/{seq.length})</p>}
      {phase === 'show' && <p className="game-status">Watch... ({seq.length} steps)</p>}
      <p className="game-substatus">Score: {score}</p>
      <div className="colormem-grid">
        {COLORS.slice(0, 8).map((c, i) => (
          <button key={i} className="colormem-btn"
            style={{ background: highlight === i ? c : `${c}44`, boxShadow: highlight === i ? `0 0 25px ${c}, inset 0 0 15px ${c}88` : 'none', transform: highlight === i ? 'scale(1.1)' : 'scale(1)' }}
            onClick={() => handleClick(i)} disabled={phase !== 'input'} />
        ))}
      </div>
      {(phase === 'start' || phase === 'lose') && <button className="game-reset-btn" onClick={phase === 'lose' ? startGame : startGame}>{phase === 'start' ? '▶ Start' : '↺ Try Again'}</button>}
    </div>
  );
}

export default ColorMemory;
