const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const categoryController = require('../controllers/categoryController');

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Product categories
 */

/**
 * Admin-only CRUD for categories
 */
/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: List categories (public)
 *     responses:
 *       200:
 *         description: List
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.post('/', auth.required, role.requireAdmin, categoryController.create);
/**
 * @swagger
 * /api/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create category (admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Created
 */
router.put('/:categoryId', auth.required, role.requireAdmin, categoryController.update);
/**
 * @swagger
 * /api/categories/{categoryId}:
 *   put:
 *     tags: [Categories]
 *     summary: Update category (admin)
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:categoryId', auth.required, role.requireAdmin, categoryController.delete);
/**
 * @swagger
 * /api/categories/{categoryId}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete category (admin)
 *     security:
 *       - bearerAuth: []
 */
router.get('/', categoryController.list);

module.exports = router;
