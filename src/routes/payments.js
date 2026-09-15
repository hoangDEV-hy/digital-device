const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Payment simulation and callbacks
 */

/**
 * @swagger
 * /api/payments/create:
 *   post:
 *     tags: [Payments]
 *     summary: Create a mock payment for an order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               method:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment initiated
 */
router.post('/create', paymentController.createPayment);

/**
 * @swagger
 * /api/payments/mock-ipn:
 *   get:
 *     tags: [Payments]
 *     summary: Mock IPN callback (simulate provider)
 *     parameters:
 *       - name: orderId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *       - name: providerTxId
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/mock-ipn', paymentController.mockIpn);

module.exports = router;
