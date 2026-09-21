const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const notificationController = require('../controllers/notificationController');

/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: User notifications (email/push) placeholder
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notifications for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications list
 */
router.get('/', auth.required, notificationController.list);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Create notification (admin/system)
 *     security:
 *       - bearerAuth: []
 */
/**
 * @swagger
 * /api/notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Create a notification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       200:
 *         description: Created
 */
router.post('/', auth.required, notificationController.create);

/**
 * @swagger
 * /api/notifications/{id}:
 *   put:
 *     tags: [Notifications]
 *     summary: Update a notification (mark read)
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', auth.required, notificationController.update);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', auth.required, notificationController.delete);

module.exports = router;
