import React, { useState, useCallback } from 'react';

const WORDS = [
  { word: 'REACT', hint: 'A JavaScript library' },
  { word: 'PYTHON', hint: 'A programming language named after a snake' },
  { word: 'GAMES', hint: 'Something fun to play' },
  { word: 'CLOUD', hint: 'Where data floats' },
  { word: 'DANCE', hint: 'Move to the rhythm' },
  { word: 'MUSIC', hint: 'Melody and harmony' },
  { word: 'SUNSET', hint: 'Evening sky colors' },
  { word: 'PLANET', hint: 'Earth is one' },
  { word: 'WONDER', hint: 'A feeling of amazement' },
  { word: 'TEMPLE', hint: 'A place of worship' },
  { word: 'FLOWER', hint: 'Blooms in a garden' },
  { word: 'STREAM', hint: 'A small river' },
  { word: 'GUITAR', hint: 'String instrument' },
  { word: 'PIXELS', hint: 'Tiny screen dots' },
  { word: 'BRIDGE', hint: 'Crosses a river' },
];

function shuffle(word) {
  let arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

function WordScramble({ userId, onScore }) {
  const [current, setCurrent] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [scrambled, setScrambled] = useState(() => shuffle(WORDS[0].word));
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState('');
  const [streak, setStreak] = useState(0);

  const nextWord = useCallback(() => {
    let next = WORDS[Math.floor(Math.random() * WORDS.length)];
    while (next.word === current.word && WORDS.length > 1) {
      next = WORDS[Math.floor(Math.random() * WORDS.length)];
    }
    setCurrent(next);
    setScrambled(shuffle(next.word));
    setGuess('');
    setResult('');
  }, [current]);

  const check = () => {
    if (guess.toUpperCase().trim() === current.word) {
      setResult('correct');
      setStreak(s => s + 1);
      if (onScore) onScore(1);
    } else {
      setResult('wrong');
      setStreak(0);
    }
  };

  return (
    <div className="game-inner">
      <h3 className="game-name">Word Scramble</h3>
      <p className="game-status">Unscramble the word!</p>
      <p className="wordscram-word">{scrambled}</p>
      <p className="wordscram-hint">Hint: {current.hint}</p>
      <input className="wordscram-input" value={guess} onChange={e => setGuess(e.target.value.toUpperCase())} placeholder="Type answer..." maxLength={20} disabled={result === 'correct'} />
      <div className="wordscram-actions">
        {result !== 'correct' && <button className="game-reset-btn" onClick={check}>✓ Check</button>}
        {result === 'correct' && <button className="game-reset-btn" onClick={nextWord}>→ Next Word</button>}
      </div>
      {result === 'wrong' && <p className="game-status" style={{ color: '#ff4757' }}>✗ Try again!</p>}
      {result === 'correct' && <p className="game-status" style={{ color: '#2ed573' }}>✓ Correct! Streak: {streak + 1}</p>}
      <p className="game-hint">Streak: {streak}</p>
    </div>
  );
}

export default WordScramble;
