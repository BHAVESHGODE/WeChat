const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const birthdayRoutes = require('./routes/birthdayRoutes');
const gaanaRoutes = require('./routes/gaanaRoutes');
const ambientRoutes = require('./routes/ambientRoutes');
const authRoutes = require('./routes/authRoutes');
const musicRoutes = require('./routes/musicRoutes');
const adYouTubeRoutes = require('./routes/adYouTubeRoutes');
const noteRoutes = require('./routes/noteRoutes');
const streakRoutes = require('./routes/streakRoutes');
const animeRoutes = require('./routes/animeRoutes');
const mangaRoutes = require('./routes/mangaRoutes');
const ghibliRoutes = require('./routes/ghibliRoutes');
const traceRoutes = require('./routes/traceRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const mangaDexRoutes = require('./routes/mangaDexRoutes');
const aniListRoutes = require('./routes/aniListRoutes');
const streamingRoutes = require('./routes/streamingRoutes');
const watchListRoutes = require('./routes/watchListRoutes');
const bookRoutes = require('./routes/bookRoutes');
const asuraScansRoutes = require('./routes/asuraScansRoutes');
const kitsuRoutes = require('./routes/kitsuRoutes');
const streamingVideoRoutes = require('./routes/streamingVideoRoutes');
const progressRoutes = require('./routes/progressRoutes');
const chatRoutes = require('./routes/chatRoutes');
const comikRoutes = require('./routes/comikRoutes');
const comixRoutes = require('./routes/comixRoutes');
const coffeeMangaRoutes = require('./routes/coffeeMangaRoutes');
const movieRoutes = require('./routes/movieRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors({
  origin: ['https://wechat-3v7m.onrender.com', 'http://localhost:3000', 'http://localhost:5001'],
  credentials: true,
}));
app.use(express.json());

app.use('/api/tasks', taskRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/birthday', birthdayRoutes);
app.use('/api/gaana', gaanaRoutes);
app.use('/api/ambient', ambientRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/adyoutube', adYouTubeRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/anime', animeRoutes);
app.use('/api/manga', mangaRoutes);
app.use('/api/ghibli', ghibliRoutes);
app.use('/api/trace', traceRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/mangadex', mangaDexRoutes);
app.use('/api/anilist', aniListRoutes);
app.use('/api/streaming', streamingRoutes);
app.use('/api/watchlist', watchListRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/asurascans', asuraScansRoutes);
app.use('/api/kitsu', kitsuRoutes);
app.use('/api/streaming-video', streamingVideoRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/comik', comikRoutes);
app.use('/api/comix', comixRoutes);
app.use('/api/coffeemanga', coffeeMangaRoutes);
app.use('/api/movies', movieRoutes);

app.get('/api', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'WeGift API is running',
    timestamp: new Date().toISOString(),
    mongodb: 'checking...'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.use('/api', userRoutes);

const clientBuild = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(clientBuild));

// Catch-all: serve React app only for non-API requests
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found', path: req.path });
  }
  res.sendFile(path.join(clientBuild, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
  });
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

connectDB().then(() => {
  try {
    const { startScheduler } = require('./services/scheduler');
    startScheduler(io);
  } catch {}
}).finally(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
