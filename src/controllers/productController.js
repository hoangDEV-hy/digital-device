const models = require('../models');
const { Product, Category, User } = models;
const sequelize = models.sequelize;
const { Op } = require('sequelize');

exports.create = async (req, res, next) => {
  try {
    const { title, description, price, categoryId, type, fileUrl, thumbnail } = req.body;
    const product = await Product.create({ title, description, price, categoryId, type, fileUrl, thumbnail, visibility: 'inactive', reviewStatus: 'pending', sellerId: req.user.id });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.sellerId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
    const fields = ['title','description','price','categoryId','type','fileUrl','thumbnail','visibility'];
    fields.forEach(f => { if (req.body[f] !== undefined) product[f] = req.body[f]; });
    await product.save();
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.softDelete = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.sellerId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
    await product.destroy();
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.getApprovedList = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, q, categoryId } = req.query;
    const where = { reviewStatus: 'approved', visibility: 'active' };
    if (q) where.title = { [Op.like]: `%${q}%` };
    if (categoryId) where.categoryId = categoryId;
    const products = await Product.findAndCountAll({ where, limit: parseInt(pageSize), offset: (page-1)*pageSize, include: [{ model: Category }, { model: User, as: 'seller', attributes: ['id','fullName'] }] });
    res.json({ success: true, data: { items: products.rows, total: products.count } });
  } catch (err) { next(err); }
};

exports.getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({ where: { sellerId: req.user.id } });
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
};

exports.getDetails = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findByPk(productId, { include: [{ model: Category }, { model: User, as: 'seller', attributes: ['id','fullName'] }] });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.reviewStatus !== 'approved' && req.user?.role !== 'admin' && product.sellerId !== req.user?.id) return res.status(403).json({ success: false, message: 'Forbidden' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.getRevenue = async (req, res, next) => {
  try {
    const { period = 'total', page = 1, pageSize = 50 } = req.query; // day, month, total
    const sellerId = req.user.id;
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    if (period === 'total') {
      const results = await sequelize.query(`
        SELECT SUM(oi.price * oi.quantity) AS total
        FROM OrderItems AS oi
        JOIN Products AS p ON p.id = oi.productId
        JOIN Orders AS o ON o.id = oi.orderId
        WHERE p.sellerId = :sellerId
          AND o.status = 'paid'
      `, { replacements: { sellerId }, type: sequelize.QueryTypes.SELECT });
      const totalRevenue = (results && results[0] && results[0].total) ? results[0].total : 0;
      return res.json({ success: true, data: { period, totalRevenue } });
    }

    // group by day or month
    let groupExpr = 'DATE(o.createdAt)';
    if (period === 'month') groupExpr = "DATE_FORMAT(o.createdAt, '%Y-%m')";

    const sql = `
      SELECT ${groupExpr} AS period, SUM(oi.price * oi.quantity) AS total
      FROM OrderItems AS oi
      JOIN Products AS p ON p.id = oi.productId
      JOIN Orders AS o ON o.id = oi.orderId
      WHERE p.sellerId = :sellerId
        AND o.status = 'paid'
      GROUP BY ${groupExpr}
      ORDER BY ${groupExpr} DESC
      LIMIT :limit OFFSET :offset
    `;

    const results = await sequelize.query(sql, { replacements: { sellerId, limit, offset }, type: sequelize.QueryTypes.SELECT });
    res.json({ success: true, data: { period, items: results, page: parseInt(page), pageSize: limit } });
  } catch (err) { next(err); }
};
/*
const [results] = await sequelize.query(`
    SELECT 
        DATE(o.createdAt) AS period,
        SUM(oi.price * oi.quantity) AS total
    FROM OrderItems AS oi
    JOIN Products AS p 
        ON p.id = oi.productId
    JOIN Orders AS o 
        ON o.id = oi.orderId
    WHERE p.sellerId = :sellerId
      AND o.status = 'paid'
    GROUP BY DATE(o.createdAt)
    ORDER BY DATE(o.createdAt) DESC
    LIMIT 10 OFFSET 0
`, {
    replacements: {
        sellerId: categoryId // hoặc sellerId thực tế
    }
});
*/

module.exports = exports;
