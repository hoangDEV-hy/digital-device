const { User } = require('../models');

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
