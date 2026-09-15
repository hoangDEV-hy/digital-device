const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const adminController = require('../controllers/adminController');

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin management actions
 */

/**
 * @swagger
 * /api/admin/users/{userId}/lock:
 *   post:
 *     tags: [Admin]
 *     summary: Lock a user account
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Locked
 */
router.post('/users/:userId/lock', auth.required, role.requireAdmin, adminController.lockUser);

/**
 * @swagger
 * /api/admin/users/{userId}/unlock:
 *   post:
 *     tags: [Admin]
 *     summary: Unlock a user account
 */
router.post('/users/:userId/unlock', auth.required, role.requireAdmin, adminController.unlockUser);

/**
 * @swagger
 * /api/admin/users/{userId}/reset-device-ip:
 *   post:
 *     tags: [Admin]
 *     summary: Reset a user's device IP binding
 */
router.post('/users/:userId/reset-device-ip', auth.required, role.requireAdmin, adminController.resetDeviceIp);

module.exports = router;
