import React, { useState, useEffect, useCallback } from 'react';

const SIZE = 4;
const EMPTY = Array(SIZE).fill().map(() => Array(SIZE).fill(0));

function slide(row) {
  let arr = row.filter(v => v);
  let missing = SIZE - arr.length;
  for (let i = 0; i < missing; i++) arr.push(0);
  let merged = Array(SIZE).fill(false);
  for (let i = 0; i < SIZE - 1; i++) {
    if (arr[i] && arr[i] === arr[i + 1] && !merged[i] && !merged[i + 1]) {
      arr[i] *= 2;
      arr.splice(i + 1, 1);
      arr.push(0);
      merged[i] = true;
    }
  }
  return arr;
}

function transpose(grid) {
  return grid[0].map((_, c) => grid.map(r => r[c]));
}

function clone(g) { return g.map(r => [...r]); }

function addTile(grid) {
  let g = clone(grid);
  let empty = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (!g[r][c]) empty.push([r, c]);
  if (!empty.length) return g;
  let [r, c] = empty[Math.floor(Math.random() * empty.length)];
  g[r][c] = Math.random() < 0.9 ? 2 : 4;
  return g;
}

const COLORS = {
  0: '#cdc1b4', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179',
  16: '#f59563', 32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72',
  256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e',
};

function Twenty48({ userId, onScore }) {
  const [grid, setGrid] = useState(() => addTile(addTile(EMPTY)));
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [over, setOver] = useState(false);

  const move = useCallback((dir) => {
    setGrid(prev => {
      let g = clone(prev);
      let rotated = false;
      if (dir === 'up') { g = transpose(g); rotated = true; }
      else if (dir === 'down') { g = transpose(g); rotated = true; }
      else if (dir === 'right') { g = g.map(r => r.reverse()); }
      let changed = false;
      let added = 0;
      g = g.map(row => {
        let s = slide(row);
        if (s.join(',') !== row.join(',')) changed = true;
        let m = 0;
        for (let i = 0; i < SIZE; i++) {
          if (s[i] !== row[i] && s[i] > row[i]) m += s[i];
        }
        added += m;
        return s;
      });
      if (dir === 'right') g = g.map(r => r.reverse());
      if (dir === 'up') g = transpose(g);
      if (dir === 'down') g = transpose(g);
      if (!changed) return prev;
      if (added > 0) setScore(s => s + added);
      g = addTile(g);
      let has2048 = g.some(r => r.some(v => v >= 2048));
      if (has2048) setWon(true);
      let hasMoves = g.some((r, ri) => r.some((v, ci) => !v || (ci < SIZE - 1 && r[ci + 1] === v) || (ri < SIZE - 1 && g[ri + 1][ci] === v)));
      if (!hasMoves) setOver(true);
      return g;
    });
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const k = e.key;
      if (k.startsWith('Arrow')) { e.preventDefault(); move(k.slice(5).toLowerCase()); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [move]);

  const reset = () => {
    setGrid(addTile(addTile(EMPTY)));
    setScore(0);
    setWon(false);
    setOver(false);
  };

  useEffect(() => {
    if (won && onScore) onScore(5);
  }, [won]);

  return (
    <div className="game-inner">
      <h3 className="game-name">2048</h3>
      <div className="t48-header"><span>Score: {score}</span>{won && <span className="t48-won">You Win!</span>}</div>
      <div className="t48-grid">{
        grid.flat().map((v, i) => <div key={i} className="t48-cell" style={{ background: COLORS[v] || '#3c3a32', color: v > 4 ? '#fff' : '#776e65', fontSize: v > 999 ? '1rem' : '1.4rem' }}>{v || ''}</div>)
      }</div>
      {over && <p className="game-status">Game Over!</p>}
      <button className="game-reset-btn" onClick={reset}>↺ New Game</button>
      <p className="game-hint">Arrow keys to move</p>
    </div>
  );
}

export default Twenty48;
