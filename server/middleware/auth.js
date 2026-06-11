const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wegift-jwt-secret');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ error: 'User not found' });
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Not authorized, invalid token' });
  }
};

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'wegift-jwt-secret', {
    expiresIn: '7d',
  });
};

module.exports = { protect, generateToken };
