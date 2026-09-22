const { User, Product, Payment, License, Review } = require('../models');
const { Op } = require('sequelize');

exports.listUsers = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 50, q } = req.query;
    const where = {};
    if (q) where[Op.or] = [{ fullName: { [Op.like]: `%${q}%` } }, { email: { [Op.like]: `%${q}%` } }];
    const users = await User.findAndCountAll({ where, limit: parseInt(pageSize), offset: (page-1)*pageSize, attributes: { exclude: ['password'] } });
    res.json({ success: true, data: { items: users.rows, total: users.count } });
  } catch (err) { next(err); }
};

exports.approveProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.reviewStatus = 'approved';
    product.visibility = 'active';
    await product.save();
    // notify seller
    const { Notification } = require('../models');
    await Notification.create({ userId: product.sellerId, type: 'product_approved', channel: 'email', payload: { productId: product.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.rejectProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.reviewStatus = 'rejected';
    product.visibility = 'inactive';
    await product.save();
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.lockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (req.user.id === userId) return res.status(400).json({ success: false, message: 'Cannot lock yourself' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.status = 'locked';
    await user.save();
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.unlockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.status = 'active';
    await user.save();
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.resetDeviceIp = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.deviceIp = null;
    await user.save();
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.listPayments = async (req, res, next) => {
  try {
    const payments = await Payment.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: payments });
  } catch (err) { next(err); }
};

exports.listLicenses = async (req, res, next) => {
  try {
    const licenses = await License.findAll({ include: [User, Product], order: [['issuedAt', 'DESC']] });
    res.json({ success: true, data: licenses });
  } catch (err) { next(err); }
};

exports.listReviews = async (req, res, next) => {
  try {
    const reviews = await Review.findAll({ include: [{ model: User, as: 'user' }, Product], order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
};

exports.resolveReport = async (req, res, next) => {
  try {
    const { Report } = require('../models');
    const report = await Report.findByPk(req.params.reportId);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    report.status = 'reviewed';
    await report.save();
    res.json({ success: true, data: report });
  } catch (err) { next(err); }
};

exports.revokeLicense = async (req, res, next) => {
  try {
    const { License } = require('../models');
    const license = await License.findByPk(req.params.licenseId);
    if (!license) return res.status(404).json({ success: false, message: 'License not found' });
    license.status = 'revoked';
    await license.save();
    res.json({ success: true, data: license });
  } catch (err) { next(err); }
};
