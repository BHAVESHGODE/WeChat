import React, { useState, useEffect, useRef } from 'react';

const ICONS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🍑', '🥝'];
const PAIRS = [...ICONS, ...ICONS].sort(() => Math.random() - 0.5);

function MemoryGame({ userId, onScore }) {
  const [cards, setCards] = useState(PAIRS.map((icon, i) => ({ icon, flipped: false, matched: false, id: i })));
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const lock = useRef(false);

  useEffect(() => {
    if (selected.length === 2) {
      lock.current = true;
      const [a, b] = selected;
      if (cards[a].icon === cards[b].icon) {
        setCards((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
        setSelected([]);
        lock.current = false;
      } else {
        setTimeout(() => {
          setCards((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c)));
          setSelected([]);
          lock.current = false;
        }, 800);
      }
    }
  }, [selected]);

  useEffect(() => {
    if (cards.every((c) => c.matched) && moves > 0 && onScore) {
      onScore(Math.max(1, 20 - moves));
    }
  }, [cards, moves]);

  const handleClick = (id) => {
    if (lock.current || cards[id].flipped || cards[id].matched || selected.length >= 2) return;
    setCards((prev) => prev.map((c, i) => (i === id ? { ...c, flipped: true } : c)));
    setSelected((prev) => [...prev, id]);
    setMoves((prev) => prev + 1);
  };

  const reset = () => {
    const shuffled = [...ICONS, ...ICONS].sort(() => Math.random() - 0.5);
    setCards(shuffled.map((icon, i) => ({ icon, flipped: false, matched: false, id: i })));
    setSelected([]);
    setMoves(0);
  };

  const done = cards.every((c) => c.matched);

  return (
    <div className="game-inner">
      <h3 className="game-name">Memory Match</h3>
      <div className="memory-stats">Moves: {moves} {done && '🎉'}</div>
      <div className="memory-grid">
        {cards.map((card) => (
          <button
            key={card.id}
            className={`memory-card ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
            onClick={() => handleClick(card.id)}
          >
            <span className="memory-card-front">{card.icon}</span>
            <span className="memory-card-back">?</span>
          </button>
        ))}
      </div>
      <button className="game-reset-btn" onClick={reset}>↺ Shuffle</button>
    </div>
  );
}

export default MemoryGame;
