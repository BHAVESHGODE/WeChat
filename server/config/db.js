const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.warn('MONGODB_URI is not defined in .env — running without database');
      return;
    }
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
    });
    console.log(`✅ MongoDB connected successfully — ${conn.connection.host}`);
  } catch (error) {
    console.warn(`MongoDB connection failed: ${error.message} — running without database`);
  }
};

module.exports = connectDB;
