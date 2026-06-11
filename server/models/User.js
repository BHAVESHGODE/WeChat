const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, default: '' },
  password: { type: String, default: '' },
  role: { type: String, default: 'user' },
  birthday: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
