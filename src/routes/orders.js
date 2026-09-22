const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const orderController = require('../controllers/orderController');

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Customer and admin order management
 */

/**
 * @swagger
 * /api/orders/my:
 *   get:
 *     tags: [Orders]
 *     summary: Get current user's order history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order history
 */
router.get('/my', auth.required, orderController.getMyOrders);

/**
 * @swagger
 * /api/orders/mine-products:
 *   get:
 *     tags: [Orders]
 *     summary: Get orders that contain the current seller's products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller-related order list
 */
router.get('/mine-products', auth.required, orderController.getOrdersForMyProducts);

/**
 * @swagger
 * /api/orders/all:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders in the system (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Full order list
 */
router.get('/all', auth.required, role.requireAdmin, orderController.getAllOrders);

module.exports = router;
