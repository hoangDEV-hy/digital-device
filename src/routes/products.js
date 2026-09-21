const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const productController = require('../controllers/productController');

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product management
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a product (seller)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Created
 */

/**
 * @swagger
 * /api/products/{productId}:
 *   put:
 *     tags:
 *       - Products
 *     summary: Update a product
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:productId', auth.required, productController.update);
/**
 * @swagger
 * /api/products/{productId}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product permanently (seller/admin)
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/:productId', auth.required, productController.softDelete);
/**
 * @swagger
 * /api/products/approved:
 *   get:
 *     tags: [Products]
 *     summary: List approved products (public)
 *     responses:
 *       200:
 *         description: List
 */
router.get('/approved', productController.getApprovedList);
/**
 * @swagger
 * /api/products/mine:
 *   get:
 *     tags: [Products]
 *     summary: Get current seller's products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/mine', auth.required, productController.getMyProducts);

/**
 * @swagger
 * /api/products/mine/revenue:
 *   get:
 *     tags: [Products]
 *     summary: Get seller revenue (grouped)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           enum: [total, day, month]
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: pageSize
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Revenue data
 */
router.get('/mine/revenue', auth.required, productController.getRevenue);

/**
 * @swagger
 * /api/products/{productId}:
 *   get:
 *     tags: [Products]
 *     summary: Get product details
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.get('/:productId', productController.getDetails);

module.exports = router;
