const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const cartController = require('../controllers/cartController');
const cartValidator = require('../validators/cartValidator');
const validate = require('../middlewares/validate');

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Shopping cart and checkout
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get current user's cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 */
router.get('/', auth.required, cartController.getCart);

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item added
 */
router.post('/items', auth.required, cartValidator.addItem, validate, cartController.addItem);

/**
 * @swagger
 * /api/cart/items/{itemId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart
 */
router.delete('/items/:itemId', auth.required, cartController.removeItem);

/**
 * @swagger
 * /api/cart/checkout:
 *   post:
 *     tags: [Cart]
 *     summary: Checkout current cart and create an order
 */
router.post('/checkout', auth.required, cartController.checkout);

module.exports = router;
