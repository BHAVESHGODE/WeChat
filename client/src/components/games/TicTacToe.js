import React, { useState, useEffect } from 'react';

const WINNERS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function TicTacToe({ userId, onScore }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xNext, setXNext] = useState(true);
  const [winner, setWinner] = useState(null);

  const checkWinner = (squares) => {
    for (const [a, b, c] of WINNERS) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return squares.every(Boolean) ? 'draw' : null;
  };

  useEffect(() => {
    const w = checkWinner(board);
    setWinner(w);
    if (w && w !== 'draw' && onScore) {
      onScore(1);
    }
  }, [board]);

  const handleClick = (i) => {
    if (board[i] || winner) return;
    const next = board.slice();
    next[i] = xNext ? 'X' : 'O';
    setBoard(next);
    setXNext(!xNext);
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setXNext(true);
    setWinner(null);
  };

  const status = winner
    ? winner === 'draw' ? "It's a draw!"
    : `${winner} wins!`
    : `${xNext ? 'X' : 'O'}'s turn`;

  return (
    <div className="game-inner">
      <h3 className="game-name">Tic-Tac-Toe</h3>
      <div className={`ttt-status ${winner ? 'winner' : ''}`}>{status}</div>
      <div className="ttt-board">
        {board.map((cell, i) => (
          <button key={i} className="ttt-cell" onClick={() => handleClick(i)}>
            {cell}
          </button>
        ))}
      </div>
      <button className="game-reset-btn" onClick={reset}>↺ New Game</button>
    </div>
  );
}

export default TicTacToe;
