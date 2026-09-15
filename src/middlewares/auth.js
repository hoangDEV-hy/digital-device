const jwtUtil = require('../utils/jwt');

exports.required = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    const payload = jwtUtil.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) { return res.status(401).json({ success: false, message: 'Invalid token' }); }
};
