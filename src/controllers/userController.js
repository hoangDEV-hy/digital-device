const { User } = require('../models');
const { Op } = require('sequelize');

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { fullName, email, phone, avatar } = req.body;

    if (email && email !== user.email) {
      const exist = await User.findOne({ where: { email, id: { [Op.ne]: user.id } } });
      if (exist) return res.status(400).json({ success: false, message: 'Email already in use' });
      user.email = email;
    }

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await user.save();

    const safeUser = await User.findByPk(user.id, { attributes: { exclude: ['password'] } });
    res.json({ success: true, message: 'Profile updated', data: safeUser });
  } catch (err) { next(err); }
};

exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file' });
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.avatar = `/uploads/${req.file.filename}`;
    await user.save();
    const safeUser = await User.findByPk(user.id, { attributes: { exclude: ['password'] } });
    res.json({ success: true, data: safeUser });
  } catch (err) { next(err); }
};

module.exports = exports;
