const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Playlist = require('./models/Playlist');
const connectDB = require('./config/db');

const seedUsers = [
  { name: 'Maverick', role: 'pioneer', birthday: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) },
  { name: 'Bell', role: 'strategist', birthday: null },
  { name: 'Goju', role: 'guardian', birthday: null },
];

const seedPlaylists = [
  {
    name: 'Lofi',
    tracks: [
      { title: 'Snowfall', artist: 'Ødysee', videoId: 'jfKfPfyJRdk', duration: 180 },
      { title: 'Rainy Night', artist: 'Lofi Girl', videoId: '5qap5aO4i9A', duration: 210 },
      { title: 'Study Beats', artist: 'Chillhop', videoId: 'DWcJFNfsesc', duration: 195 },
      { title: 'Gentle Breeze', artist: 'Tomppabeats', videoId: 'lTRBdUZ3bWk', duration: 200 },
      { title: 'Focus Mode', artist: 'Lofi Fruits', videoId: 'HjINZgV3-PE', duration: 185 },
    ],
    createdBy: 'admin',
  },
  {
    name: 'Motivation',
    tracks: [
      { title: 'Never Gonna Give You Up', artist: 'Rick Astley', videoId: 'dQw4w9WgXcQ', duration: 212 },
      { title: 'Shape of You', artist: 'Ed Sheeran', videoId: 'JGwWNGJdvx8', duration: 234 },
      { title: 'See You Again', artist: 'Wiz Khalifa', videoId: 'RgKAFK5djSk', duration: 230 },
      { title: 'Thinking Out Loud', artist: 'Ed Sheeran', videoId: 'kPa7bsKwL-c', duration: 282 },
      { title: 'Sugar', artist: 'Maroon 5', videoId: '09R8_2nJtjg', duration: 255 },
    ],
    createdBy: 'admin',
  },
  {
    name: 'Romantic',
    tracks: [
      { title: 'All of Me', artist: 'John Legend', videoId: 'IJ_2Z6E8mII', duration: 269 },
      { title: "Can't Help Falling in Love", artist: 'Elvis Presley', videoId: '450p7goxZqg', duration: 180 },
      { title: 'A Thousand Years', artist: 'Christina Perri', videoId: 'LPhe1eGqKsc', duration: 285 },
      { title: 'Perfect', artist: 'Ed Sheeran', videoId: 'JGWb1G7uCdg', duration: 263 },
      { title: 'Photograph', artist: 'Ed Sheeran', videoId: 'WA4iX5D9G64', duration: 259 },
    ],
    createdBy: 'admin',
  },
];

const seed = async () => {
  await connectDB();

  try {
    await User.deleteMany({});
    const users = await User.insertMany(seedUsers);
    console.log(`Seeded ${users.length} users: ${users.map((u) => u.name).join(', ')}`);
    console.log(`  Maverick's birthday set to today for testing — the 🎂 Birthday Surprise will appear!`);

    await Playlist.deleteMany({});
    const playlists = await Playlist.insertMany(seedPlaylists);
    console.log(`Seeded ${playlists.length} playlists: ${playlists.map((p) => p.name).join(', ')}`);
  } catch (error) {
    console.error(`Seed error: ${error.message}`);
    console.log('If you see a buffering timeout, the database may need repair.');
    console.log('Run: mongosh --eval "db.adminCommand({ repairDatabase: 1 })"');
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

seed();
