import React, { useState, useCallback } from 'react';

const SIZE = 4;

function isSolvable(tiles) {
  let inv = 0;
  for (let i = 0; i < tiles.length; i++)
    for (let j = i + 1; j < tiles.length; j++)
      if (tiles[i] && tiles[j] && tiles[i] > tiles[j]) inv++;
  return inv % 2 === 0;
}

function initPuzzle() {
  let tiles = Array.from({ length: SIZE * SIZE - 1 }, (_, i) => i + 1);
  tiles.push(0);
  do {
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
  } while (!isSolvable(tiles));
  return tiles;
}

function NumPuzzle({ userId, onScore }) {
  const [tiles, setTiles] = useState(initPuzzle);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const moveTile = useCallback((idx) => {
    if (won) return;
    const empty = tiles.indexOf(0);
    const row = Math.floor(idx / SIZE), col = idx % SIZE;
    const eRow = Math.floor(empty / SIZE), eCol = empty % SIZE;
    if (Math.abs(row - eRow) + Math.abs(col - eCol) !== 1) return;
    let next = [...tiles];
    [next[idx], next[empty]] = [next[empty], next[idx]];
    setTiles(next);
    const newMoves = moves + 1;
    setMoves(newMoves);
    if (next.join(',') === Array.from({ length: SIZE * SIZE - 1 }, (_, i) => i + 1).concat(0).join(',')) {
      setWon(true);
      if (onScore) onScore(Math.max(1, Math.floor(20 / newMoves * 3)));
    }
  }, [tiles, moves, won, onScore]);

  const reset = () => {
    setTiles(initPuzzle());
    setMoves(0);
    setWon(false);
  };

  return (
    <div className="game-inner">
      <h3 className="game-name">Number Puzzle</h3>
      <p className="game-status">{won ? '🎉 You solved it!' : `Moves: ${moves}`}</p>
      <div className="numpuzzle-grid">
        {tiles.map((v, i) => (
          <button key={i} className={`numpuzzle-cell ${v === 0 ? 'numpuzzle-empty' : ''}`} onClick={() => moveTile(i)} disabled={v === 0}>
            {v || ''}
          </button>
        ))}
      </div>
      <button className="game-reset-btn" onClick={reset}>↺ New Puzzle</button>
    </div>
  );
}

export default NumPuzzle;
