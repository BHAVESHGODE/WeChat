import React, { useState, useEffect, useRef, useCallback } from 'react';

const W = 300;
const H = 400;
const GRAVITY = 0.5;
const JUMP = -8;
const PIPE_W = 40;
const PIPE_SPEED = 2;
const PIPE_GAP = 120;
const BIRD_SIZE = 20;

function FlappyBird({ userId, onScore }) {
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const birdY = useRef(H / 2);
  const birdV = useRef(0);
  const pipes = useRef([]);
  const score = useRef(0);
  const [renderTick, setRenderTick] = useState(0);
  const frameRef = useRef(null);
  const scoreState = useRef(0);

  const jump = useCallback(() => {
    if (!playing || gameOver) return;
    birdV.current = JUMP;
  }, [playing, gameOver]);

  const startGame = useCallback(() => {
    birdY.current = H / 2;
    birdV.current = 0;
    pipes.current = [{ x: W, top: 100 + Math.random() * 150 }];
    score.current = 0;
    scoreState.current = 0;
    setGameOver(false);
    setPlaying(true);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const loop = () => {
      birdV.current += GRAVITY;
      birdY.current += birdV.current;

      if (birdY.current < 0) birdY.current = 0;
      if (birdY.current > H - BIRD_SIZE) { setGameOver(true); setPlaying(false); return; }

      pipes.current = pipes.current.map(p => ({ ...p, x: p.x - PIPE_SPEED })).filter(p => p.x > -PIPE_W);

      if (pipes.current.length === 0 || pipes.current[pipes.current.length - 1].x < W - 180) {
        pipes.current.push({ x: W, top: 60 + Math.random() * (H - PIPE_GAP - 120) });
      }

      for (let p of pipes.current) {
        if (p.x < BIRD_SIZE + 10 && p.x + PIPE_W > 10) {
          if (birdY.current < p.top || birdY.current + BIRD_SIZE > p.top + PIPE_GAP) {
            setGameOver(true);
            setPlaying(false);
            return;
          }
          if (p.x + PIPE_W < 30 && !p.passed) {
            p.passed = true;
            score.current++;
            scoreState.current = score.current;
            if (onScore) onScore(1);
          }
        }
      }

      setRenderTick(t => t + 1);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [playing, onScore]);

  useEffect(() => {
    const handler = (e) => { if (e.code === 'Space' || e.type === 'click') { e.preventDefault(); jump(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [jump]);

  return (
    <div className="game-inner">
      <h3 className="game-name">Flappy Bird</h3>
      <div className="flappy-container" onClick={jump} style={{ position: 'relative', width: W, height: H, background: 'linear-gradient(180deg, #4dc9f6, #87ceeb)', borderRadius: 8, overflow: 'hidden', margin: '0 auto', cursor: 'pointer' }}>
        {!playing && !gameOver && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', zIndex: 10, background: 'rgba(0,0,0,0.3)' }}>
          <p style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Flappy Bird</p>
          <button className="game-reset-btn" onClick={startGame} style={{ marginTop: 8 }}>▶ Start</button>
        </div>}
        {gameOver && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', zIndex: 10, background: 'rgba(0,0,0,0.4)' }}>
          <p style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Game Over!</p>
          <p style={{ color: '#ffd700', fontSize: 16 }}>Score: {score.current}</p>
          <button className="game-reset-btn" onClick={startGame} style={{ marginTop: 8 }}>↺ Play Again</button>
        </div>}
        <div style={{ position: 'absolute', left: 10, top: birdY.current, width: BIRD_SIZE, height: BIRD_SIZE, background: '#ffd700', borderRadius: '50%', transition: 'none', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🐤</div>
        {pipes.current.map((p, i) => (
          <React.Fragment key={i}>
            <div style={{ position: 'absolute', left: p.x, top: 0, width: PIPE_W, height: p.top, background: 'linear-gradient(180deg, #2ed573, #26a65b)', borderRadius: '0 0 6px 6px', border: '2px solid #1b8a4a', boxSizing: 'border-box' }} />
            <div style={{ position: 'absolute', left: p.x, top: p.top + PIPE_GAP, width: PIPE_W, height: H - p.top - PIPE_GAP, background: 'linear-gradient(0deg, #2ed573, #26a65b)', borderRadius: '6px 6px 0 0', border: '2px solid #1b8a4a', boxSizing: 'border-box' }} />
          </React.Fragment>
        ))}
        <div style={{ position: 'absolute', top: 6, right: 8, color: '#fff', fontSize: 14, fontWeight: 700, zIndex: 5 }}>Score: {scoreState.current}</div>
      </div>
      <p className="game-hint">Press Space or Click to flap</p>
    </div>
  );
}

export default FlappyBird;
