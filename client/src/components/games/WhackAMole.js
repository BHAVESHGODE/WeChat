import React, { useState, useEffect, useRef, useCallback } from 'react';

const GRID_SIZE = 9;
const MOLE_TIME = 800;
const GAME_DURATION = 30;

function WhackAMole({ userId, onScore }) {
  const [moles, setMoles] = useState(Array(GRID_SIZE).fill(false));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);

  const spawnMole = useCallback(() => {
    setMoles(prev => {
      const next = [...prev];
      const empty = next.map((v, i) => v ? -1 : i).filter(v => v >= 0);
      if (empty.length > 0 && Math.random() < 0.6) {
        const idx = empty[Math.floor(Math.random() * empty.length)];
        next[idx] = true;
        setTimeout(() => setMoles(p => { const n = [...p]; n[idx] = false; return n; }), MOLE_TIME);
      }
      return next;
    });
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setMoles(Array(GRID_SIZE).fill(false));
    setPlaying(true);
    intervalRef.current = setInterval(spawnMole, 500);
  }, [spawnMole]);

  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(intervalRef.current);
          clearInterval(timerRef.current);
          setPlaying(false);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => { clearInterval(intervalRef.current); clearInterval(timerRef.current); };
  }, [playing]);

  const whack = (idx) => {
    if (!moles[idx]) return;
    setMoles(p => { const n = [...p]; n[idx] = false; return n; });
    setScore(p => p + 1);
    if (onScore) onScore(1);
  };

  return (
    <div className="game-inner">
      <h3 className="game-name">Whack-a-Mole</h3>
      {playing ? (
        <>
          <div className="whack-header"><span>Score: {score}</span><span>Time: {timeLeft}s</span></div>
          <div className="whack-grid">
            {moles.map((isMole, i) => (
              <button key={i} className={`whack-hole ${isMole ? 'whack-up' : ''}`} onClick={() => whack(i)}>
                {isMole ? <span className="whack-mole">🐹</span> : <span className="whack-hole-inner">○</span>}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="game-status">Whack as many moles as you can in 30s!</p>
          {score > 0 && <p className="game-substatus">Last score: {score}</p>}
        </>
      )}
      {!playing && <button className="game-reset-btn" onClick={startGame}>{score > 0 ? '↺ Play Again' : '▶ Start Game'}</button>}
    </div>
  );
}

export default WhackAMole;
