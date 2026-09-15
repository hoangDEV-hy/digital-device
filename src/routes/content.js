const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const licenseController = require('../controllers/licenseController');

/**
 * @swagger
 * tags:
 *   - name: Content
 *     description: Content access, licenses and streaming
 */

/**
 * @swagger
 * /api/content/my-library:
 *   get:
 *     tags: [Content]
 *     summary: Get products owned by current user (licenses)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User licenses
 */
router.get('/my-library', auth.required, licenseController.myLibrary);

/**
 * @swagger
 * /api/content/licenses/{licenseId}/revoke:
 *   post:
 *     tags: [Content]
 *     summary: Revoke a license (admin only)
 *     parameters:
 *       - name: licenseId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revoked
 */
router.post('/licenses/:licenseId/revoke', auth.required, role.requireAdmin, licenseController.revoke);

/**
 * @swagger
 * /api/content/signed/{productId}:
 *   get:
 *     tags: [Content]
 *     summary: Get signed URL for streaming a product (owner only)
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
 *         description: Signed URL
 */
router.get('/signed/:productId', auth.required, licenseController.getSignedUrl);

/**
 * @swagger
 * /api/content/stream/{token}:
 *   get:
 *     tags: [Content]
 *     summary: Stream content by signed token
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Streamed file
 */
router.get('/stream/:token', licenseController.streamByToken);

module.exports = router;
