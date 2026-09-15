const jwt = require('jsonwebtoken');

const accessSecret = process.env.JWT_ACCESS_SECRET || 'change_this_access_secret';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'change_this_refresh_secret';
const accessExpiry = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const refreshExpiry = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

exports.signAccessToken = (payload) => jwt.sign(payload, accessSecret, { expiresIn: accessExpiry });
exports.signRefreshToken = (payload) => jwt.sign(payload, refreshSecret, { expiresIn: refreshExpiry });
exports.verifyAccessToken = (token) => jwt.verify(token, accessSecret);
exports.verifyRefreshToken = (token) => jwt.verify(token, refreshSecret);
exports.getRefreshExpiryDate = () => {
  const now = new Date();
  // Default 7 days
  now.setDate(now.getDate() + 7);
  return now;
};
