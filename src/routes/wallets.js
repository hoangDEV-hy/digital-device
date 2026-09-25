/**
 * @swagger
 * tags:
 *   - name: Wallets
 *     description: Wallet, escrow, deposit, seller contract and refund operations
 */
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const walletController = require('../controllers/walletController');

/**
 * @swagger
 * /api/wallets/me:
 *   get:
 *     tags: [Wallets]
 *     summary: Get current user wallet summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet summary
 */
router.get('/me', auth.required, walletController.getWalletSummary);

/**
 * @swagger
 * /api/wallets/transactions:
 *   get:
 *     tags: [Wallets]
 *     summary: List wallet transactions for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet transactions
 */
router.get('/transactions', auth.required, walletController.listTransactions);

/**
 * @swagger
 * /api/wallets/register-seller-contract:
 *   post:
 *     tags: [Wallets]
 *     summary: Register seller contract with required deposit
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Seller contract registered
 */
router.post('/register-seller-contract', auth.required, walletController.registerSellerContract);

/**
 * @swagger
 * /api/wallets/cancel-seller-contract:
 *   post:
 *     tags: [Wallets]
 *     summary: Cancel seller contract after refund window closes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contract cancelled and deposit returned
 */
router.post('/cancel-seller-contract', auth.required, walletController.cancelSellerContract);

/**
 * @swagger
 * /api/wallets/withdraw:
 *   post:
 *     tags: [Wallets]
 *     summary: Withdraw available wallet balance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Withdrawal successful
 */
router.post('/withdraw', auth.required, walletController.withdrawFunds);

/**
 * @swagger
 * /api/wallets/manual-update:
 *   post:
 *     tags: [Wallets]
 *     summary: Admin manual wallet update
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, amount]
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [deposit, escrow_hold, escrow_release, penalty]
 *               amount:
 *                 type: number
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wallet updated
 */
router.post('/manual-update', auth.required, role.requireAdmin, walletController.updateWalletBalance);

/**
 * @swagger
 * /api/wallets/escrow/hold:
 *   post:
 *     tags: [Wallets]
 *     summary: Hold escrow funds for an order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Escrow funds held
 */
router.post('/escrow/hold', auth.required, walletController.holdEscrowOnSale);

/**
 * @swagger
 * /api/wallets/escrow/release:
 *   post:
 *     tags: [Wallets]
 *     summary: Release escrow after the 7-day window
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Escrow released
 */
router.post('/escrow/release', auth.required, walletController.releaseEscrowAfterSevenDays);

/**
 * @swagger
 * /api/wallets/refund:
 *   post:
 *     tags: [Wallets]
 *     summary: Process a refund based on when the return is requested
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *               refundAmount:
 *                 type: number
 *               returnType:
 *                 type: string
 *                 enum: [before_7_days, after_7_days]
 *               requestedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Refund processed
 */
router.post('/refund', auth.required, walletController.processReturn);

/**
 * @swagger
 * /api/wallets/admin/refund:
 *   post:
 *     tags: [Wallets]
 *     summary: Admin auto-handle refund based on return window rules
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *               refundAmount:
 *                 type: number
 *               requestedAt:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund auto-handled by admin
 */
router.post('/admin/refund', auth.required, role.requireAdmin, walletController.adminHandleRefund);

/**
 * @swagger
 * /api/wallets/admin/list:
 *   get:
 *     tags: [Wallets]
 *     summary: List all wallets for admin review
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet list
 */
router.get('/admin/list', auth.required, role.requireAdmin, walletController.adminListWallets);

/**
 * @swagger
 * /api/wallets/admin/{userId}/suspend:
 *   post:
 *     tags: [Wallets]
 *     summary: Suspend seller rights when deposit policy is violated
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Seller suspended
 */
router.post('/admin/:userId/suspend', auth.required, role.requireAdmin, walletController.adminSuspendSeller);

/**
 * @swagger
 * /api/wallets/admin/{userId}/resume:
 *   post:
 *     tags: [Wallets]
 *     summary: Resume seller rights after deposit is restored
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Seller resumed
 */
router.post('/admin/:userId/resume', auth.required, role.requireAdmin, walletController.adminResumeSeller);

module.exports = router;
