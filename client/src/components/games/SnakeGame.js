import React, { useState, useEffect, useRef } from 'react';

const W = 20;
const H = 20;

function getInitialSnake() {
  return [{ x: 10, y: 10 }];
}

function randomFood(snake) {
  let p;
  do {
    p = { x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H) };
  } while (snake.some((s) => s.x === p.x && s.y === p.y));
  return p;
}

function SnakeGame({ userId, onScore }) {
  const [snake, setSnake] = useState(getInitialSnake);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [dir, setDir] = useState({ x: 1, y: 0 });
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const dirRef = useRef(dir);
  const runningRef = useRef(false);

  useEffect(() => {
    dirRef.current = dir;
  }, [dir]);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    const handleKey = (e) => {
      if (!runningRef.current) return;
      const keyMap = {
        ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
      };
      const nd = keyMap[e.key];
      if (nd && (nd.x !== -dirRef.current.x || nd.y !== -dirRef.current.y)) {
        e.preventDefault();
        setDir(nd);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (!running || gameOver) return;
    const tick = setInterval(() => {
      setSnake((prev) => {
        const head = { x: prev[0].x + dirRef.current.x, y: prev[0].y + dirRef.current.y };
        if (head.x < 0 || head.x >= W || head.y < 0 || head.y >= H || prev.some((s) => s.x === head.x && s.y === head.y)) {
          setGameOver(true);
          setRunning(false);
          return prev;
        }
        const ate = head.x === food.x && head.y === food.y;
        const next = [head, ...prev];
        if (!ate) next.pop();
        else {
          setFood(randomFood(next));
          setScore((s) => s + 1);
        }
        return next;
      });
    }, 150);
    return () => clearInterval(tick);
  }, [running, gameOver, food]);

  useEffect(() => {
    if (gameOver && score > 0 && onScore) {
      onScore(score);
    }
  }, [gameOver]);

  const reset = () => {
    const newSnake = getInitialSnake();
    setSnake(newSnake);
    setFood(randomFood(newSnake));
    setDir({ x: 1, y: 0 });
    setRunning(false);
    setGameOver(false);
    setScore(0);
  };

  return (
    <div className="game-inner">
      <h3 className="game-name">Snake</h3>
      <div className="snake-stats">Score: {score} {gameOver && '💀 Game Over'}</div>
      <div className="snake-grid">
        {Array.from({ length: H }, (_, y) => (
          <div key={y} className="snake-row">
            {Array.from({ length: W }, (_, x) => {
              const isSnake = snake.some((s) => s.x === x && s.y === y);
              const isHead = snake[0]?.x === x && snake[0]?.y === y;
              const isFood = food.x === x && food.y === y;
              return (
                <span
                  key={x}
                  className={`snake-cell ${isHead ? 'head' : ''} ${isSnake && !isHead ? 'body' : ''} ${isFood ? 'food' : ''}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="snake-controls">
        {!running && !gameOver && (
          <button className="game-reset-btn" onClick={() => setRunning(true)}>▶ Start</button>
        )}
        {running && (
          <button className="game-reset-btn" onClick={() => setRunning(false)}>⏸ Pause</button>
        )}
        {(gameOver || running) && (
          <button className="game-reset-btn" onClick={reset}>↺ Restart</button>
        )}
      </div>
    </div>
  );
}

export default SnakeGame;
