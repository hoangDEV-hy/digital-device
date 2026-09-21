const { User, Report } = require('../models');

exports.sendReport = async (req, res, next) => {
  try {
    const { reportedUserId, reason } = req.body;
    const reported = await User.findByPk(reportedUserId);
    if (!reported) return res.status(404).json({ success: false, message: 'Reported user not found' });
    const r = await Report.create({ reporterId: req.user.id, reportedUserId, reason });
    res.json({ success: true, data: r });
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    const reports = await Report.findAll({ include: [{ model: User, as: 'reporter', attributes: ['id','fullName','email'] }] });
    res.json({ success: true, data: reports });
  } catch (err) { next(err); }
};

module.exports = exports;
