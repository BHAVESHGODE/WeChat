const axios = require('axios');
const Movie = require('../models/Movie');
const MovieFavorite = require('../models/MovieFavorite');
const MovieWatchlist = require('../models/MovieWatchlist');

// Static Curated Movies for Fallback
const FALLBACK_MOVIES = [
  {
    title: 'The Matrix',
    originalTitle: 'The Matrix',
    imdbId: 'tt0133093',
    posterUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600',
    backdropUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200',
    synopsis: 'Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.',
    genres: ['Action', 'Sci-Fi'],
    releaseYear: 1999,
    runtime: 136,
    rating: 8.7,
    director: 'Lana Wachowski, Lilly Wachowski',
    cast: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss', 'Hugo Weaving'],
    streamingAvailability: [
      { platform: 'Netflix', logoUrl: 'https://img.icons8.com/color/100/netflix--v1.png', url: 'https://www.netflix.com/title/2055954', region: 'US' },
      { platform: 'Netflix', logoUrl: 'https://img.icons8.com/color/100/netflix--v1.png', url: 'https://www.netflix.com/title/2055954', region: 'IN' },
      { platform: 'Prime Video', logoUrl: 'https://img.icons8.com/color/100/amazon-prime-video.png', url: 'https://www.primevideo.com/', region: 'US' },
      { platform: 'Prime Video', logoUrl: 'https://img.icons8.com/color/100/amazon-prime-video.png', url: 'https://www.primevideo.com/', region: 'IN' },
      { platform: 'Disney+ Hotstar', logoUrl: 'https://img.icons8.com/color/100/disney-plus.png', url: 'https://www.hotstar.com/', region: 'IN' }
    ],
    redirectLinks: [
      { siteName: 'VegaMovies', url: 'https://vegamovies.pages.dev/search?q=The+Matrix' },
      { siteName: 'HDHub4u', url: 'https://hdhub4u.wtf/?s=The+Matrix' }
    ]
  },
  {
    title: 'Kabhi Khushi Kabhie Gham',
    originalTitle: 'Kabhi Khushi Kabhie Gham',
    imdbId: 'tt0248126',
    posterUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600',
    backdropUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=1200',
    synopsis: 'Yashvardhan Raichand lives a wealthy lifestyle along with his wife, Nandini, and two sons, Rahul and Rohan. While Rohan is sent to a boarding school, Rahul is adopted. Yashvardhan expects Rahul to marry a girl of his status, but Rahul falls in love with a middle-class girl named Anjali, leading to a family breakdown.',
    genres: ['Drama', 'Romance', 'Musical'],
    releaseYear: 2001,
    runtime: 210,
    rating: 7.4,
    director: 'Karan Johar',
    cast: ['Amitabh Bachchan', 'Jaya Bachchan', 'Shah Rukh Khan', 'Kajol', 'Hrithik Roshan', 'Kareena Kapoor'],
    streamingAvailability: [
      { platform: 'Netflix', logoUrl: 'https://img.icons8.com/color/100/netflix--v1.png', url: 'https://www.netflix.com/title/60023662', region: 'IN' },
      { platform: 'Netflix', logoUrl: 'https://img.icons8.com/color/100/netflix--v1.png', url: 'https://www.netflix.com/title/60023662', region: 'US' },
      { platform: 'Prime Video', logoUrl: 'https://img.icons8.com/color/100/amazon-prime-video.png', url: 'https://www.primevideo.com/', region: 'IN' }
    ],
    redirectLinks: [
      { siteName: 'VegaMovies', url: 'https://vegamovies.pages.dev/search?q=Kabhi+Khushi' }
    ]
  },
  {
    title: 'Interstellar',
    originalTitle: 'Interstellar',
    imdbId: 'tt0816692',
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200',
    synopsis: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    releaseYear: 2014,
    runtime: 169,
    rating: 8.6,
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
    streamingAvailability: [
      { platform: 'Prime Video', logoUrl: 'https://img.icons8.com/color/100/amazon-prime-video.png', url: 'https://www.primevideo.com/', region: 'US' },
      { platform: 'Prime Video', logoUrl: 'https://img.icons8.com/color/100/amazon-prime-video.png', url: 'https://www.primevideo.com/', region: 'IN' },
      { platform: 'Netflix', logoUrl: 'https://img.icons8.com/color/100/netflix--v1.png', url: 'https://www.netflix.com/title/70305903', region: 'UK' }
    ],
    redirectLinks: [
      { siteName: 'VegaMovies', url: 'https://vegamovies.pages.dev/search?q=Interstellar' },
      { siteName: 'HDHub4u', url: 'https://hdhub4u.wtf/?s=Interstellar' }
    ]
  },
  {
    title: 'Inception',
    originalTitle: 'Inception',
    imdbId: 'tt1375666',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200',
    synopsis: 'Cobb, a skilled thief who steals valuable secrets from deep within the subconscious during the dream state, is given a chance at redemption: enter a target\'s mind and plant an idea.',
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    releaseYear: 2010,
    runtime: 148,
    rating: 8.8,
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy'],
    streamingAvailability: [
      { platform: 'Netflix', logoUrl: 'https://img.icons8.com/color/100/netflix--v1.png', url: 'https://www.netflix.com/', region: 'US' },
      { platform: 'Prime Video', logoUrl: 'https://img.icons8.com/color/100/amazon-prime-video.png', url: 'https://www.primevideo.com/', region: 'IN' }
    ],
    redirectLinks: [
      { siteName: 'VegaMovies', url: 'https://vegamovies.pages.dev/search?q=Inception' }
    ]
  },
  {
    title: 'Spirited Away',
    originalTitle: 'Sen to Chihiro no Kamikakushi',
    imdbId: 'tt0245429',
    posterUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600',
    backdropUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200',
    synopsis: 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.',
    genres: ['Animation', 'Fantasy', 'Family'],
    releaseYear: 2001,
    runtime: 125,
    rating: 8.6,
    director: 'Hayao Miyazaki',
    cast: ['Rumi Hiiragi', 'Miyu Irino', 'Mari Natsuki'],
    streamingAvailability: [
      { platform: 'Netflix', logoUrl: 'https://img.icons8.com/color/100/netflix--v1.png', url: 'https://www.netflix.com/title/60023642', region: 'US' },
      { platform: 'Netflix', logoUrl: 'https://img.icons8.com/color/100/netflix--v1.png', url: 'https://www.netflix.com/title/60023642', region: 'IN' }
    ],
    redirectLinks: [
      { siteName: 'VegaMovies', url: 'https://vegamovies.pages.dev/search?q=Spirited+Away' }
    ]
  }
];

// Helper: Seed initial fallback movies to Database if empty
async function seedDefaultMovies() {
  try {
    const countWithImdb = await Movie.countDocuments({ imdbId: { $exists: true } });
    if (countWithImdb === 0) {
      await Movie.deleteMany({});
      await Movie.insertMany(FALLBACK_MOVIES);
      console.log('Seeded curated movies database with IMDb IDs successfully!');
    }
  } catch (err) {
    console.error('Failed to seed default movies:', err.message);
  }
}

// Invoke seed logic to ensure DB has items
seedDefaultMovies();

// 1. Search Movies
async function searchMovies(req, res) {
  try {
    const { q, region = 'IN' } = req.query;
    if (!q) {
      // Return default list if no query
      const dbMovies = await Movie.find().limit(20);
      return res.json({ data: dbMovies });
    }

    const reg = region.toUpperCase();
    let results = [];

    // Attempt calling JustWatch & MyFlixer APIs (Using try/catch individually)
    try {
      // JustWatch Example Call
      const formattedTitle = encodeURIComponent(q.replace(/\s+/g, ''));
      const justWatchRes = await axios.get(`https://api.justwatch.com/v3/${reg.toLowerCase()}/movies?title=${formattedTitle}`, { timeout: 3000 });
      if (justWatchRes.data && justWatchRes.data.length > 0) {
        results = justWatchRes.data;
      }
    } catch (e) {
      // JustWatch fail fallback
    }

    try {
      // MyFlixer Example Call
      if (results.length === 0) {
        const myFlixerRes = await axios.get(`https://api.myflixer.net/v3/search?query=${encodeURIComponent(q)}`, { timeout: 3000 });
        if (myFlixerRes.data && myFlixerRes.data.length > 0) {
          results = myFlixerRes.data;
        }
      }
    } catch (e) {
      // MyFlixer fail fallback
    }

    // Database search fallback
    let dbMatches = await Movie.find({ title: { $regex: q, $options: 'i' } });

    // Fallback static matches
    const staticMatches = FALLBACK_MOVIES.filter(m => 
      m.title.toLowerCase().includes(q.toLowerCase()) || 
      m.genres.some(g => g.toLowerCase().includes(q.toLowerCase()))
    );

    // Combine matches
    let combined = [...dbMatches];
    staticMatches.forEach(sm => {
      if (!combined.some(c => c.title.toLowerCase() === sm.title.toLowerCase())) {
        combined.push(sm);
      }
    });

    // If still empty, return default listing
    if (combined.length === 0) {
      combined = await Movie.find().limit(6);
    }

    res.json({ data: combined });
  } catch (err) {
    console.error('Movie search error:', err.message);
    res.status(500).json({ error: 'Failed to search movies' });
  }
}

// 2. Get Movie By ID
async function getMovieById(req, res) {
  try {
    const { id } = req.params;

    // Check if it's a valid Mongo ObjectId
    const isValidObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    let movie = null;

    if (isValidObjectId) {
      movie = await Movie.findById(id);
    }

    if (!movie) {
      // Fallback matching by title or index
      movie = await Movie.findOne({ title: { $regex: id.replace(/-/g, ' '), $options: 'i' } });
      if (!movie) {
        const index = parseInt(id);
        if (!isNaN(index) && index >= 0 && index < FALLBACK_MOVIES.length) {
          movie = FALLBACK_MOVIES[index];
        } else {
          movie = FALLBACK_MOVIES[0]; // default fallback
        }
      }
    }

    res.json({ data: movie });
  } catch (err) {
    console.error('Movie detail error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve movie details' });
  }
}

// 3. Save / Toggle Favorite
async function toggleFavorite(req, res) {
  try {
    const { userId, movieId, title, posterUrl } = req.body;
    if (!userId || !movieId) {
      return res.status(400).json({ error: 'userId and movieId are required' });
    }

    const existing = await MovieFavorite.findOne({ userId, movieId });
    if (existing) {
      await MovieFavorite.deleteOne({ userId, movieId });
      return res.json({ status: 'removed', message: 'Removed from favorites' });
    } else {
      const fav = new MovieFavorite({ userId, movieId, title, posterUrl });
      await fav.save();
      return res.json({ status: 'added', data: fav });
    }
  } catch (err) {
    console.error('Movie favorite toggle error:', err.message);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
}

// 4. Get Favorites List
async function getFavorites(req, res) {
  try {
    const { userId } = req.params;
    const favorites = await MovieFavorite.find({ userId }).populate('movieId');
    res.json({ data: favorites });
  } catch (err) {
    console.error('Get favorites error:', err.message);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
}

// 5. Update Watchlist Status & Progress
async function updateWatchlist(req, res) {
  try {
    const { userId, movieId, status, progress, title, posterUrl } = req.body;
    if (!userId || !movieId) {
      return res.status(400).json({ error: 'userId and movieId are required' });
    }

    const query = { userId, movieId };
    const update = { 
      status, 
      progress, 
      title, 
      posterUrl, 
      updatedAt: Date.now() 
    };
    
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    const item = await MovieWatchlist.findOneAndUpdate(query, update, options);

    res.json({ data: item });
  } catch (err) {
    console.error('Watchlist update error:', err.message);
    res.status(500).json({ error: 'Failed to update watchlist' });
  }
}

// 6. Get Watchlist
async function getWatchlist(req, res) {
  try {
    const { userId } = req.params;
    const items = await MovieWatchlist.find({ userId }).populate('movieId');
    res.json({ data: items });
  } catch (err) {
    console.error('Get watchlist error:', err.message);
    res.status(500).json({ error: 'Failed to get watchlist' });
  }
}

// 7. Get Recommendations
async function getRecommendations(req, res) {
  try {
    // Return recommendations based on genres in user favorites
    const { userId } = req.query;
    let preferredGenres = [];

    if (userId) {
      const favorites = await MovieFavorite.find({ userId }).populate('movieId');
      favorites.forEach(f => {
        if (f.movieId && f.movieId.genres) {
          preferredGenres = [...preferredGenres, ...f.movieId.genres];
        }
      });
    }

    let query = {};
    if (preferredGenres.length > 0) {
      // Unique list of genres
      preferredGenres = [...new Set(preferredGenres)];
      query = { genres: { $in: preferredGenres } };
    }

    let recommendations = await Movie.find(query).limit(6);
    if (recommendations.length < 2) {
      recommendations = await Movie.find().limit(6);
    }

    res.json({ data: recommendations });
  } catch (err) {
    console.error('Get recommendations error:', err.message);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
}

module.exports = {
  searchMovies,
  getMovieById,
  toggleFavorite,
  getFavorites,
  updateWatchlist,
  getWatchlist,
  getRecommendations,
};
