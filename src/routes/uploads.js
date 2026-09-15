const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const uploadController = require('../controllers/uploadController');

/**
 * @swagger
 * tags:
 *   - name: Uploads
 *     description: File uploads for images and product content
 */

/**
 * @swagger
 * /api/uploads/image:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload an image (avatar/thumbnail)
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Uploaded
 */
router.post('/image', (req, res, next) => upload.uploadImage(req, res, (err) => err ? next(err) : uploadController.uploadImage(req, res, next)));

/**
 * @swagger
 * /api/uploads/file:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload product content file
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Uploaded
 */
router.post('/file', (req, res, next) => upload.uploadContent(req, res, (err) => err ? next(err) : uploadController.uploadContent(req, res, next)));

module.exports = router;
