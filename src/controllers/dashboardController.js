const { User, Product, Report, OrderItem, Order } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

exports.summary = async (req, res, next) => {
  try {
    const { sinceDays = 7 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(sinceDays));
    const newUsers = await User.count({ where: { createdAt: { [Op.gte]: since } } });
    const lockedUsers = await User.count({ where: { status: 'locked' } });
    const pendingProducts = await Product.count({ where: { reviewStatus: 'pending' } });
    res.json({ success: true, data: { newUsers, lockedUsers, pendingProducts } });
  } catch (err) { next(err); }
};

exports.reportedUsers = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 50 } = req.query;
    // aggregate reports by reportedUserId
    const reportsAgg = await Report.findAll({
      attributes: ['reportedUserId', [fn('COUNT', col('id')), 'reportsCount'], [fn('MAX', col('createdAt')), 'lastReportAt']],
      group: ['reportedUserId'],
      order: [[literal('reportsCount'), 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page)-1) * parseInt(pageSize),
    });

    // fetch user details for each reportedUserId
    const userIds = reportsAgg.map(r => r.reportedUserId);
    const users = await User.findAll({ where: { id: userIds }, attributes: ['id','fullName','email','status','createdAt'] });

    const items = reportsAgg.map(r => {
      const u = users.find(x => x.id === r.reportedUserId) || null;
      return { reportedUserId: r.reportedUserId, reportsCount: r.get('reportsCount'), lastReportAt: r.get('lastReportAt'), user: u };
    });

    res.json({ success: true, data: { items, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) { next(err); }
};

exports.revenueStats = async (req, res, next) => {
  try {
    // Admin revenue overview: total revenue, revenue by day/month
    const { period = 'total', page = 1, pageSize = 50 } = req.query; // period: total|day|month
    if (period === 'total') {
      const row = await OrderItem.findOne({ attributes: [[fn('SUM', literal('price*quantity')), 'totalRevenue']] });
      return res.json({ success: true, data: { totalRevenue: row.get('totalRevenue') || 0 } });
    }

    // grouping
    let dateExpr;
    if (period === 'day') dateExpr = fn('DATE', col('Order.createdAt'));
    else dateExpr = literal("DATE_FORMAT(\"Order\".\"createdAt\", '%Y-%m')");

    const sql = `SELECT ${period === 'day' ? 'DATE(\"Order\".\"createdAt\")' : "DATE_FORMAT(\"Order\".\"createdAt\", '%Y-%m')"} as period, SUM(oi.price*oi.quantity) as total
      FROM \"OrderItems\" oi
      JOIN \"Orders\" \"Order\" ON \"Order\".id = oi.\"orderId\"
      WHERE \"Order\".status = 'paid'
      GROUP BY period
      ORDER BY period DESC
      LIMIT :limit OFFSET :offset`;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page)-1) * limit;
    const results = await OrderItem.sequelize.query(sql, { replacements: { limit, offset }, type: OrderItem.sequelize.QueryTypes.SELECT });
    res.json({ success: true, data: { period, items: results, page: parseInt(page), pageSize: limit } });
  } catch (err) { next(err); }
};

module.exports = exports;
