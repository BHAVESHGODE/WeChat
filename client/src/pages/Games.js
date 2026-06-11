import React, { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TicTacToe from '../components/games/TicTacToe';
import RockPaperScissors from '../components/games/RockPaperScissors';
import SnakeGame from '../components/games/SnakeGame';
import MemoryGame from '../components/games/MemoryGame';
import Twenty48 from '../components/games/Twenty48';
import SimonSays from '../components/games/SimonSays';
import WhackAMole from '../components/games/WhackAMole';
import WordScramble from '../components/games/WordScramble';
import Minesweeper from '../components/games/Minesweeper';
import FlappyBird from '../components/games/FlappyBird';
import ColorMemory from '../components/games/ColorMemory';
import DinoJump from '../components/games/DinoJump';
import Hangman from '../components/games/Hangman';
import NumPuzzle from '../components/games/NumPuzzle';

const API = process.env.REACT_APP_API_URL + '/api/scores';

const GAMES = [
  { key: 'tictactoe', label: 'Tic-Tac-Toe', icon: '❌', desc: 'Classic 3x3', comp: TicTacToe },
  { key: 'rps', label: 'Rock-Paper-Scissors', icon: '🪨', desc: 'Beat the computer', comp: RockPaperScissors },
  { key: 'snake', label: 'Snake', icon: '🐍', desc: 'Grow the snake', comp: SnakeGame },
  { key: 'memory', label: 'Memory Match', icon: '🧠', desc: 'Find the pairs', comp: MemoryGame },
  { key: '2048', label: '2048', icon: '🔢', desc: 'Merge the tiles', comp: Twenty48 },
  { key: 'simon', label: 'Simon Says', icon: '🔴', desc: 'Repeat the pattern', comp: SimonSays },
  { key: 'whack', label: 'Whack-a-Mole', icon: '🔨', desc: 'Smash those moles', comp: WhackAMole },
  { key: 'scramble', label: 'Word Scramble', icon: '🔤', desc: 'Unscramble the word', comp: WordScramble },
  { key: 'minesweeper', label: 'Minesweeper', icon: '💣', desc: 'Avoid the bombs', comp: Minesweeper },
  { key: 'flappy', label: 'Flappy Bird', icon: '🐤', desc: 'Fly through pipes', comp: FlappyBird },
  { key: 'colormem', label: 'Color Memory', icon: '🎨', desc: 'Remember colors', comp: ColorMemory },
  { key: 'dino', label: 'Dino Jump', icon: '🦖', desc: 'Jump the obstacles', comp: DinoJump },
  { key: 'hangman', label: 'Hangman', icon: '💀', desc: 'Save the stickman', comp: Hangman },
  { key: 'numpuzzle', label: 'Number Puzzle', icon: '🧩', desc: 'Slide to order', comp: NumPuzzle },
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
