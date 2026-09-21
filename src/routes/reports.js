const express = require('express');
const router = express.Router();
/**
 * @swagger
 * tags:
 *   - name: Reports
 *     description: Reporting users
 */
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const reportController = require('../controllers/reportController');

/**
 * Submit a user report
 */
/**
 * @swagger
 * /api/reports:
 *   post:
 *     tags: [Reports]
 *     summary: Submit a report about a user (authenticated)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportedUserId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Report submitted
 */
router.post('/', auth.required, reportController.sendReport);
/**
 * @swagger
 * /api/reports:
 *   get:
 *     tags: [Reports]
 *     summary: List reports (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reports
 */
router.get('/', auth.required, role.requireAdmin, reportController.list);

module.exports = router;