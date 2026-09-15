const express = require('express');
const router = express.Router();
const { User } = require('../models');
const auth = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User profile and management
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/me', auth.required, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json({ success: true, message: '', data: user });
  } catch (err) { next(err); }
});

module.exports = router;
