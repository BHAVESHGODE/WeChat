import React, { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TicTacToe from '../components/games/TicTacToe';
import RockPaperScissors from '../components/games/RockPaperScissors';
import SnakeGame from '../components/games/SnakeGame';

const API = process.env.REACT_APP_API_URL + '/api/scores';

const GAMES = [
  { key: 'tictactoe', label: 'Tic-Tac-Toe', icon: '❌', desc: 'Classic 3x3', comp: TicTacToe },
  { key: 'rps', label: 'Rock-Paper-Scissors', icon: '🪨', desc: 'Beat the computer', comp: RockPaperScissors },
  { key: 'snake', label: 'Snake', icon: '🐍', desc: 'Grow the snake', comp: SnakeGame },
];

function Games() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = searchParams.get('user') || 'Maverick';
  const [active, setActive] = useState(null);
  const [scores, setScores] = useState([]);

  const loadScores = useCallback(async () => {
    try {
      const res = await fetch(`${API}/${user}`);
      const data = await res.json();
      setScores(data);
    } catch (e) { /* ignore */ }
  }, [user]);

  const handleScore = useCallback(async (points) => {
    const gameKey = GAMES.find((g) => g.key === active)?.key;
    if (!gameKey) return;
    try {
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user, game: gameKey, score: points }),
      });
      loadScores();
    } catch (e) { /* ignore */ }
  }, [user, active, loadScores]);

  const ActiveGame = GAMES.find((g) => g.key === active)?.comp;

  return (
    <div className="games-page">
      <button className="back-btn" onClick={() => navigate(`/${user.toLowerCase()}`)}>
        ← Dashboard
      </button>
      <h1 className="games-page-title">🎮 Games</h1>
      <p className="games-page-subtitle">Have fun, {user}!</p>

      {!active ? (
        <>
          <div className="games-grid">
            {GAMES.map((g) => (
              <button key={g.key} className="game-card" onClick={() => setActive(g.key)}>
                <span className="game-card-icon">{g.icon}</span>
                <span className="game-card-label">{g.label}</span>
                <span className="game-card-desc">{g.desc}</span>
              </button>
            ))}
          </div>

          <div className="games-scores">
            <h3>Your Recent Scores</h3>
            {scores.length === 0 && <p className="scores-empty">No scores yet. Play a game!</p>}
            {scores.slice(0, 10).map((s, i) => (
              <div key={i} className="score-row">
                <span className="score-game">{s.game}</span>
                <span className="score-pts">{s.score} pts</span>
                <span className="score-time">{new Date(s.playedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="game-active">
          <button className="back-btn back-btn-inset" onClick={() => setActive(null)}>
            ← All Games
          </button>
          <ActiveGame userId={user} onScore={handleScore} />
        </div>
      )}
    </div>
  );
}

export default Games;
