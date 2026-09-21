const { Notification } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const items = await Notification.findAll({ where: { userId } });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { userId, type, channel, payload } = req.body;
    const n = await Notification.create({ userId, type, channel, payload });
    res.json({ success: true, data: n });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await Notification.findByPk(id);
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    const { read } = req.body;
    if (read !== undefined) note.read = read;
    await note.save();
    res.json({ success: true, data: note });
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await Notification.findByPk(id);
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    await note.destroy();
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = exports;
