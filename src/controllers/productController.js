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

const normalizePage = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizePageSize = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  const safe = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(Math.max(safe, 1), 100);
};

const buildProductFilters = (query = {}, publicOnly = true) => {
  const where = {};

  if (publicOnly) {
    where.reviewStatus = 'approved';
    where.visibility = 'active';
  }

  const {
    q,
    categoryId,
    minPrice,
    maxPrice,
    type,
    reviewStatus,
    sellerId,
    visibility,
  } = query;

  if (q) {
    where[Op.or] = [
      { title: { [Op.like]: `%${q}%` } },
      { description: { [Op.like]: `%${q}%` } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;
  if (sellerId) where.sellerId = sellerId;
  if (type) where.type = type;
  if (reviewStatus) where.reviewStatus = reviewStatus;
  if (visibility) where.visibility = visibility;

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price[Op.gte] = Number(minPrice);
    if (maxPrice !== undefined) where.price[Op.lte] = Number(maxPrice);
  }

  return where;
};

const buildProductSort = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const allowedSortFields = ['title', 'price', 'createdAt'];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
  return [[safeSortBy, safeSortOrder]];
};

exports.searchProducts = async (req, res, next) => {
  try {
    const {
      q,
      categoryId,
      minPrice,
      maxPrice,
      type,
      reviewStatus,
      sellerId,
      visibility,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      pageSize = 20,
    } = req.query;

    const where = buildProductFilters(
      {
        q,
        categoryId,
        minPrice,
        maxPrice,
        type,
        reviewStatus,
        sellerId,
        visibility,
      },
      !reviewStatus && !sellerId && !visibility
    );

    const limit = normalizePageSize(pageSize, 20);
    const offset = (normalizePage(page, 1) - 1) * limit;

    const products = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order: buildProductSort(sortBy, sortOrder),
      include: [{ model: Category }, { model: User, as: 'seller', attributes: ['id', 'fullName'] }],
    });

    res.json({
      success: true,
      data: {
        items: products.rows,
        total: products.count,
        page: normalizePage(page, 1),
        pageSize: limit,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getApprovedList = async (req, res, next) => {
  try {
    req.query = {
      ...req.query,
      reviewStatus: req.query.reviewStatus || 'approved',
      visibility: req.query.visibility || 'active',
    };
    return exports.searchProducts(req, res, next);
  } catch (err) {
    next(err);
  }
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
