const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const reviewController = require('../controllers/reviewController');

/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: Product reviews
 */

/**
 * @swagger
 * /api/reviews/products/{productId}:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a review for a purchased product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created
 */
router.post('/products/:productId', auth.required, reviewController.createReview);

/**
 * @swagger
 * /api/reviews/products/{productId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews for a product
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product reviews
 */
router.get('/products/:productId', reviewController.listProductReviews);

/**
 * @swagger
 * /api/reviews/my-seller-products:
 *   get:
 *     tags: [Reviews]
 *     summary: View reviews for products sold by current seller
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller reviews list
 */
router.get('/my-seller-products', auth.required, reviewController.listMySellerReviews);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Permanently delete a review (admin)
 *     description: Hard delete review from database.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */
router.delete('/:reviewId', auth.required, reviewController.removeReview);

module.exports = router;
