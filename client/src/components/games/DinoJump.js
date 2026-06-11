import React, { useState, useEffect, useRef, useCallback } from 'react';

const GROUND_Y = 340;
const DINO_W = 30;
const DINO_H = 40;
const OBSTACLE_W = 20;
const SPEED = 3;

function DinoJump({ userId, onScore }) {
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const dinoY = useRef(GROUND_Y);
  const velocity = useRef(0);
  const obstacles = useRef([]);
  const groundOffset = useRef(0);
  const scoreRef = useRef(0);
  const frameRef = useRef(null);
  const [, forceRender] = useState(0);

  const jump = useCallback(() => {
    if (!playing || gameOver) return;
    if (dinoY.current < GROUND_Y - 5) return;
    velocity.current = -10;
  }, [playing, gameOver]);

  const startGame = useCallback(() => {
    dinoY.current = GROUND_Y;
    velocity.current = 0;
    obstacles.current = [];
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    setPlaying(true);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const loop = () => {
      velocity.current += 0.6;
      dinoY.current += velocity.current;
      if (dinoY.current > GROUND_Y) { dinoY.current = GROUND_Y; velocity.current = 0; }
      groundOffset.current = (groundOffset.current + SPEED) % 40;

      obstacles.current = obstacles.current.map(o => ({ ...o, x: o.x - SPEED })).filter(o => o.x > -OBSTACLE_W);
      if (obstacles.current.length === 0 || obstacles.current[obstacles.current.length - 1].x < 400) {
        obstacles.current.push({ x: 600, h: 25 + Math.random() * 35 });
      }

      for (let o of obstacles.current) {
        if (o.x < 50 + DINO_W && o.x + OBSTACLE_W > 50) {
          if (dinoY.current + DINO_H > GROUND_Y - o.h) {
            setGameOver(true);
            setPlaying(false);
            return;
          }
        }
        if (o.x + OBSTACLE_W < 50 && !o.passed) {
          o.passed = true;
          scoreRef.current++;
          setScore(scoreRef.current);
          if (onScore && scoreRef.current % 5 === 0) onScore(1);
        }
      }
      forceRender(t => t + 1);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [playing, onScore]);

  useEffect(() => {
    const handler = (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [jump]);

  return (
    <div className="game-inner">
      <h3 className="game-name">Dino Jump</h3>
      <div className="dino-container" onClick={jump} style={{ position: 'relative', width: 500, height: 400, background: 'linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 70%, #d4a574 70%, #c4956a 100%)', borderRadius: 8, overflow: 'hidden', margin: '0 auto', cursor: 'pointer', maxWidth: '100%' }}>
        {!playing && !gameOver && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', zIndex: 10, background: 'rgba(0,0,0,0.15)' }}>
          <p style={{ color: '#333', fontSize: 22, fontWeight: 700, margin: 0 }}>🦖 Dino Jump</p>
          <button className="game-reset-btn" onClick={startGame} style={{ marginTop: 8 }}>▶ Start</button>
        </div>}
        {gameOver && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', zIndex: 10, background: 'rgba(0,0,0,0.2)' }}>
          <p style={{ color: '#333', fontSize: 18, fontWeight: 700 }}>Game Over!</p>
          <p style={{ color: '#e67e22', fontSize: 16 }}>Score: {score}</p>
          <button className="game-reset-btn" onClick={startGame} style={{ marginTop: 8 }}>↺ Play Again</button>
        </div>}
        <div style={{ position: 'absolute', left: 50, top: dinoY.current, width: DINO_W, height: DINO_H, transition: 'none', zIndex: 5, fontSize: 28, lineHeight: '40px', textAlign: 'center' }}>🦖</div>
        {obstacles.current.map((o, i) => (
          <div key={i} style={{ position: 'absolute', left: o.x, bottom: 0, width: OBSTACLE_W, height: o.h, background: '#8B4513', borderRadius: '4px 4px 0 0', border: '1px solid #6B3410' }} />
        ))}
        <div style={{ position: 'absolute', top: 6, right: 8, color: '#333', fontSize: 14, fontWeight: 700, zIndex: 5 }}>Score: {score}</div>
      </div>
      <p className="game-hint">Press Space/Up or Click to jump</p>
    </div>
  );
}

export default DinoJump;
