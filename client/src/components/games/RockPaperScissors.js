import React, { useState } from 'react';

const CHOICES = [
  { name: 'Rock', icon: '🪨', beats: 'Scissors' },
  { name: 'Scissors', icon: '✂️', beats: 'Paper' },
  { name: 'Paper', icon: '📄', beats: 'Rock' },
];

function RockPaperScissors({ userId, onScore }) {
  const [playerChoice, setPlayerChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [result, setResult] = useState('');
  const [wins, setWins] = useState(0);

  const play = (choice) => {
    const comp = CHOICES[Math.floor(Math.random() * CHOICES.length)];
    setPlayerChoice(choice);
    setComputerChoice(comp);

    if (choice.name === comp.name) {
      setResult("It's a draw!");
    } else if (choice.beats === comp.name) {
      setResult('You win! 🎉');
      setWins((prev) => {
        const next = prev + 1;
        if (onScore) onScore(1);
        return next;
      });
    } else {
      setResult('Computer wins! 💻');
    }
  };

  const reset = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult('');
    setWins(0);
  };

  return (
    <div className="game-inner">
      <h3 className="game-name">Rock-Paper-Scissors</h3>
      <p className="rps-wins">Wins: {wins}</p>
      <div className="rps-choices">
        {CHOICES.map((c) => (
          <button key={c.name} className="rps-btn" onClick={() => play(c)}>
            <span className="rps-icon">{c.icon}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>
      {playerChoice && computerChoice && (
        <div className="rps-result">
          <p>You: {playerChoice.icon} vs {computerChoice.icon} :Computer</p>
          <p className="rps-outcome">{result}</p>
        </div>
      )}
      <button className="game-reset-btn" onClick={reset}>↺ Reset</button>
    </div>
  );
}

export default RockPaperScissors;
