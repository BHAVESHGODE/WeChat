import React, { useState, useCallback } from 'react';

const ROWS = 8;
const COLS = 8;
const MINES = 10;

function initGrid() {
  let grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ({ mine: false, revealed: false, adjacent: 0, flagged: false })));
  let placed = 0;
  while (placed < MINES) {
    let r = Math.floor(Math.random() * ROWS);
    let c = Math.floor(Math.random() * COLS);
    if (!grid[r][c].mine) { grid[r][c].mine = true; placed++; }
  }
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (!grid[r][c].mine)
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++)
            if (r + dr >= 0 && r + dr < ROWS && c + dc >= 0 && c + dc < COLS && grid[r + dr][c + dc].mine)
              grid[r][c].adjacent++;
  return grid;
}

function Minesweeper({ userId, onScore }) {
  const [grid, setGrid] = useState(initGrid);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);

  const reveal = useCallback((r, c) => {
    if (over || won || grid[r][c].flagged || grid[r][c].revealed) return;
    setGrid(prev => {
      let g = prev.map(row => row.map(cell => ({ ...cell })));
      let stack = [[r, c]];
      let revealed = 0;
      while (stack.length) {
        let [cr, cc] = stack.pop();
        if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS || g[cr][cc].revealed || g[cr][cc].flagged) continue;
        g[cr][cc].revealed = true;
        revealed++;
        if (g[cr][cc].mine) {
          setOver(true);
          return prev;
        }
        if (g[cr][cc].adjacent === 0) {
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++)
              if (dr !== 0 || dc !== 0) stack.push([cr + dr, cc + dc]);
        }
      }
      setRevealedCount(p => p + revealed);
      let totalSafe = ROWS * COLS - MINES;
      if (revealedCount + revealed >= totalSafe) {
        setWon(true);
        if (onScore) onScore(3);
      }
      return g;
    });
  }, [over, won, revealedCount]);

  const toggleFlag = (r, c, e) => {
    e.preventDefault();
    if (over || won || grid[r][c].revealed) return;
    setGrid(prev => {
      let g = prev.map(row => row.map(cell => ({ ...cell })));
      g[r][c].flagged = !g[r][c].flagged;
      return g;
    });
  };

  const reset = () => {
    setGrid(initGrid());
    setOver(false);
    setWon(false);
    setRevealedCount(0);
  };

  return (
    <div className="game-inner">
      <h3 className="game-name">Minesweeper</h3>
      <p className="game-status">{won ? 'You Won! 🎉' : over ? '💥 Game Over!' : `Mines: ${MINES}`}</p>
      <div className="mine-grid">
        {grid.flat().map((cell, i) => {
          const r = Math.floor(i / COLS), c = i % COLS;
          return (
            <button key={i} className={`mine-cell ${cell.revealed ? 'mine-revealed' : ''} ${cell.flagged && !cell.revealed ? 'mine-flagged' : ''} ${cell.mine && cell.revealed ? 'mine-boom' : ''}`}
              onClick={() => reveal(r, c)} onContextMenu={(e) => toggleFlag(r, c, e)}>
              {cell.revealed ? (cell.mine ? '💣' : cell.adjacent || '') : cell.flagged ? '🚩' : ''}
            </button>
          );
        })}
      </div>
      <button className="game-reset-btn" onClick={reset}>↺ New Game</button>
      <p className="game-hint">Left-click to reveal, Right-click for flag</p>
    </div>
  );
}

export default Minesweeper;
