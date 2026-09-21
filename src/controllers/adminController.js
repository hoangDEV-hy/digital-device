const { User, Product } = require('../models');
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
