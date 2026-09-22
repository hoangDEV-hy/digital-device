const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const userController = require('../controllers/userController');
const dashboardController = require('../controllers/dashboardController');


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

/**
 * Admin: list users
 */
router.get('/users', auth.required, role.requireAdmin, adminController.listUsers);
router.get('/payments', auth.required, role.requireAdmin, adminController.listPayments);
router.get('/licenses', auth.required, role.requireAdmin, adminController.listLicenses);
router.get('/reviews', auth.required, role.requireAdmin, adminController.listReviews);
router.patch('/reports/:reportId/resolve', auth.required, role.requireAdmin, adminController.resolveReport);
router.patch('/licenses/:licenseId/revoke', auth.required, role.requireAdmin, adminController.revokeLicense);
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List users (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedUsers'
 */

/**
 * Admin: review product (approve/reject)
 */
router.post('/products/:productId/approve', auth.required, role.requireAdmin, adminController.approveProduct);
router.post('/products/:productId/reject', auth.required, role.requireAdmin, adminController.rejectProduct);
/**
 * @swagger
 * /api/admin/products/{productId}/approve:
 *   post:
 *     tags: [Admin]
 *     summary: Approve a product
 *     security:
 *       - bearerAuth: []
 */
/**
 * @swagger
 * /api/admin/products/{productId}/reject:
 *   post:
 *     tags: [Admin]
 *     summary: Reject a product
 *     security:
 *       - bearerAuth: []
 */

/**
 * Admin dashboard
 */
router.get('/dashboard/summary', auth.required, role.requireAdmin, dashboardController.summary);
/**
 * @swagger
 * /api/admin/dashboard/summary:
 *   get:
 *     tags: [Admin]
 *     summary: Admin dashboard summary (new users, locked users, pending products)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sinceDays
 *         schema:
 *           type: integer
 *         description: Number of days to look back for "new users" (default 7)
 *     responses:
 *       200:
 *         description: Summary object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     newUsers:
 *                       type: integer
 *                     lockedUsers:
 *                       type: integer
 *                     pendingProducts:
 *                       type: integer
 */
router.get('/dashboard/reported-users', auth.required, role.requireAdmin, dashboardController.reportedUsers);
/**
 * @swagger
 * /api/admin/dashboard/reported-users:
 *   get:
 *     tags: [Admin]
 *     summary: List users who have been reported with aggregated counts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated reported users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ReportedUser'
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 */
// reports listing for admin
/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     tags: [Admin]
 *     summary: List reports (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports list
 */
router.get('/reports', auth.required, role.requireAdmin, require('../controllers/reportController').list);
/**
 * @swagger
 * /api/admin/dashboard/revenue:
 *   get:
 *     tags: [Admin]
 *     summary: Revenue statistics (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [total, day, month]
 *         description: Aggregation period
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Revenue results
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalRevenue:
 *                           type: number
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     data:
 *                       type: object
 *                       properties:
 *                         period:
 *                           type: string
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/RevenuePeriod'
 */
router.get('/dashboard/revenue', auth.required, role.requireAdmin, dashboardController.revenueStats);

module.exports = router;
