const { License, Product } = require('../models');
const path = require('path');
const fs = require('fs');
const jwtUtil = require('../utils/jwt');

exports.myLibrary = async (req, res, next) => {
  try {
    const licenses = await License.findAll({ where: { userId: req.user.id, status: 'active' }, include: [Product] });
    res.json({ success: true, data: licenses });
  } catch (err) { next(err); }
};

exports.revoke = async (req, res, next) => {
  try {
    const { licenseId } = req.params;
    const lic = await License.findByPk(licenseId);
    if (!lic) return res.status(404).json({ success: false, message: 'License not found' });
    lic.status = 'revoked';
    await lic.save();
    res.json({ success: true });
  } catch (err) { next(err); }
};

// Generate a signed token to stream product file if user owns license
exports.getSignedUrl = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const lic = await License.findOne({ where: { userId: req.user.id, productId, status: 'active' } });
    if (!lic) return res.status(403).json({ success: false, message: 'No license' });
    const token = jwtUtil.signAccessToken({ productId, typ: 'stream' });
    // token short-lived by access token expiry
    res.json({ success: true, data: { url: `/api/content/stream/${token}` } });
  } catch (err) { next(err); }
};

// Stream endpoint uses token param (token is in path)
exports.streamByToken = async (req, res, next) => {
  try {
    const token = req.params.token;
    const payload = jwtUtil.verifyAccessToken(token);
    if (!payload || payload.typ !== 'stream') return res.status(403).json({ success: false, message: 'Invalid token' });
    const product = await Product.findByPk(payload.productId);
    if (!product || !product.fileUrl) return res.status(404).json({ success: false, message: 'File not found' });
    const filePath = path.join(process.cwd(), product.fileUrl.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File missing on server' });
    res.setHeader('Content-Type', 'application/octet-stream');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) { next(err); }
};
