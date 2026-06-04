const { dbModel } = require('../config/db');

const userSchema = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' }, // 'user' or 'admin'
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiresAt: { type: String },
  refreshToken: { type: String }
};

module.exports = dbModel('User', userSchema);
