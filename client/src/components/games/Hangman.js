import React, { useState, useCallback } from 'react';

const WORDS = ['REACT', 'JAVASCRIPT', 'DEVELOPER', 'BIRTHDAY', 'GAMES', 'PROGRAMMING', 'FUN', 'CODING', 'HANGMAN', 'COMPUTER', 'KEYBOARD', 'MONITOR', 'INTERNET', 'WEBSITE', 'CREATIVE'];

const PARTS = ['head', 'body', 'left-arm', 'right-arm', 'left-leg', 'right-leg'];

function Hangman({ userId, onScore }) {
  const [word, setWord] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [guessed, setGuessed] = useState([]);
  const [wrong, setWrong] = useState(0);
  const [result, setResult] = useState('');

  const guess = useCallback((letter) => {
    if (result) return;
    if (guessed.includes(letter)) return;
    setGuessed(prev => [...prev, letter]);
    if (!word.includes(letter)) {
      const next = wrong + 1;
      setWrong(next);
      if (next >= 6) setResult('lose');
    } else {
      const all = word.split('').every(l => guessed.includes(l) || l === letter);
      if (all) { setResult('win'); if (onScore) onScore(2); }
    }
  }, [word, guessed, wrong, result, onScore]);

  const reset = () => {
    setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuessed([]);
    setWrong(0);
    setResult('');
  };

  const display = word.split('').map(l => guessed.includes(l) ? l : '_').join(' ');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return (
    <div className="game-inner">
      <h3 className="game-name">Hangman</h3>
      <div className="hangman-draw">
        <pre className="hangman-art">
          {`  +---+
  ${wrong > 0 ? '|' : ' '}   |
  ${wrong > 0 ? 'O' : ' '}   |
 ${wrong > 2 ? '/' : ' '}${wrong > 1 ? '|' : ' '}${wrong > 3 ? '\\' : ' '}  |
 ${wrong > 4 ? '/' : ' '} ${wrong > 5 ? '\\' : ' '}  |
      ===`}
        </pre>
      </div>
      <p className="hangman-word">{display}</p>
      {result === 'lose' && <p className="game-status" style={{ color: '#ff4757' }}>Game Over! Word was: {word}</p>}
      {result === 'win' && <p className="game-status" style={{ color: '#2ed573' }}>You saved him! 🎉</p>}
      <div className="hangman-keys">
        {alphabet.split('').map(l => (
          <button key={l} className={`hangman-key ${guessed.includes(l) ? (word.includes(l) ? 'hangman-correct' : 'hangman-wrong') : ''}`}
            onClick={() => guess(l)} disabled={guessed.includes(l) || !!result}>
            {l}
          </button>
        ))}
      </div>
      <button className="game-reset-btn" onClick={reset}>↺ New Word</button>
    </div>
  );
}

export default Hangman;
