import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MusicProvider } from './context/MusicContext';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Login from './pages/Login';
import DashboardMaverick from './pages/DashboardMaverick';
import DashboardBell from './pages/DashboardBell';
import DashboardGoju from './pages/DashboardGoju';
import StudyRoom from './pages/StudyRoom';
import MusicPlayer from './pages/MusicPlayer';
import VentingRoom from './pages/VentingRoom';
import YouTubeClone from './components/YouTubeClone';
import Games from './pages/Games';
import BirthdayPage from './pages/BirthdayPage';
import GojuBirthday from './pages/GojuBirthday';

import NotificationBell from './components/NotificationBell';
import StudyZone from './pages/StudyZone';
import AnimeHub from './pages/AnimeHub';
import AnimeDetail from './pages/AnimeDetail';
import MangaHub from './pages/MangaHub';
import MangaDetail from './pages/MangaDetail';
import MangaReader from './pages/MangaReader';
import GhibliHub from './pages/GhibliHub';
import TraceMoe from './pages/TraceMoe';
import MyFavorites from './pages/MyFavorites';
import WatchListPage from './pages/WatchListPage';
import MangaDexDetail from './pages/MangaDexDetail';
import AnimeWatch from './pages/AnimeWatch';
import CurrentlyReading from './pages/CurrentlyReading';
import CurrentlyWatching from './pages/CurrentlyWatching';
import BookHub from './pages/BookHub';
import BookDetail from './pages/BookDetail';
import BookReader from './pages/BookReader';
import BookFavorites from './pages/BookFavorites';
import ChaloBaatKarteHai from './pages/ChaloBaatKarteHai';
import MovieHub from './pages/MovieHub';
import MovieDetail from './pages/MovieDetail';
import NotFound from './pages/NotFound';
import './styles/App.css';
import './styles/Music.css';
import './styles/StudyZone.css';
import './styles/Anime.css';
import './styles/AnimeHub.css';
import './styles/BookHub.css';
import './styles/YouTubePremium.css';
import './styles/YouTubeClone.css';
import './styles/GitHubChat.css';
import './styles/ChaloBaatKarteHai.css';
import './styles/Layout.css';
import './styles/MovieHub.css';
import './styles/SpotifyTheme.css';
import './styles/GojuBirthday.css';

function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    }
  }, []);

  return (
    <AuthProvider>
      <ErrorBoundary>
      <MusicProvider>
        <div className="app">
          <div className="app-content">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/quick-login" element={<Login />} />
              <Route path="/maverick" element={<DashboardMaverick />} />
              <Route path="/bell" element={<DashboardBell />} />
              <Route path="/goju" element={<DashboardGoju />} />
              <Route path="/goju/birthday" element={<GojuBirthday />} />
              <Route path="/study-room" element={<StudyRoom />} />
              <Route path="/music" element={<MusicPlayer />} />
              <Route path="/music/playlists" element={<MusicPlayer />} />
              <Route path="/music/discover" element={<MusicPlayer />} />
              <Route path="/music/ambient" element={<MusicPlayer />} />
              <Route path="/youtube" element={<YouTubeClone />} />
              <Route path="/music/adyoutube" element={<MusicPlayer />} />
              <Route path="/study-zone" element={<StudyZone />} />
              <Route path="/study-zone/tasks" element={<StudyZone />} />
              <Route path="/study-zone/notes" element={<StudyZone />} />
              <Route path="/study-zone/timer" element={<StudyZone />} />
              <Route path="/study-zone/progress" element={<StudyZone />} />
              <Route path="/venting-room" element={<VentingRoom />} />
              <Route path="/games" element={<Games />} />
              <Route path="/birthday" element={<BirthdayPage />} />
              <Route path="/anime-hub" element={<AnimeHub />} />
              <Route path="/anime-hub/manga" element={<MangaHub />} />
              <Route path="/anime-hub/manga/:id" element={<MangaDetail />} />
              <Route path="/anime-hub/manga/mangadex/:id" element={<MangaDexDetail />} />
              <Route path="/anime-hub/manga/reader/:id" element={<MangaReader />} />
              <Route path="/anime-hub/manga/reader/mangadex/:id" element={<MangaReader />} />
              <Route path="/anime-hub/manga/reader/scans/:source/:mangaId/:chapterId" element={<MangaReader />} />
              <Route path="/anime-hub/ghibli" element={<GhibliHub />} />
              <Route path="/anime-hub/trace" element={<TraceMoe />} />
              <Route path="/anime-hub/favorites" element={<MyFavorites />} />
              <Route path="/anime-hub/watchlist" element={<WatchListPage />} />
              <Route path="/anime-hub/watch" element={<AnimeWatch />} />
              <Route path="/anime-hub/tracking" element={<CurrentlyWatching />} />
              <Route path="/anime-hub/reading" element={<CurrentlyReading />} />
              <Route path="/anime/:id" element={<AnimeDetail />} />
              <Route path="/books" element={<BookHub />} />
              <Route path="/books/favorites" element={<BookFavorites />} />
              <Route path="/books/reader/:id" element={<BookReader />} />
              <Route path="/books/:id" element={<BookDetail />} />
              <Route path="/github-chat" element={<ChaloBaatKarteHai />} />
              <Route path="/chalo-baat-karte-hai" element={<ChaloBaatKarteHai />} />
              <Route path="/movies" element={<MovieHub />} />
              <Route path="/movies/:id" element={<MovieDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>

          <NotificationBell />
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </MusicProvider>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
