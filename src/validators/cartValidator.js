const { body } = require('express-validator');

exports.addItem = [
  body('productId').notEmpty().withMessage('productId required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('quantity must be >=1'),
];
