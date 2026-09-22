const express = require('express');
const router = express.Router();
const { User } = require('../models');
const auth = require('../middlewares/auth');
const userController = require('../controllers/userController');
const authValidator = require('../validators/authValidator');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');

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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/me', auth.required, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json({ success: true, message: '', data: user });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     tags: [Users]
 *     summary: Update current user's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.put('/me', auth.required, authValidator.updateProfile, validate, userController.updateProfile);

/**
 * Upload avatar for current user
 *
 * @swagger
 * /api/users/me/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload avatar for current user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Uploaded avatar
 */
router.post('/me/avatar', auth.required, (req, res, next) => upload.uploadImage(req, res, (err) => err ? next(err) : userController.uploadAvatar(req, res, next)));

module.exports = router;
