const { body } = require('express-validator');

exports.register = [
  body('fullName').notEmpty().withMessage('Full name required'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 8 }).withMessage('Password min 8 chars')
    .matches(/[a-z]/).withMessage('Password must contain lowercase')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase')
    .matches(/[0-9]/).withMessage('Password must contain number'),
];

exports.login = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password required'),
];

exports.updateProfile = [
  body('fullName').optional().notEmpty().withMessage('Full name required'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('phone').optional().isMobilePhone('vi-VN').withMessage('Invalid Vietnam phone number'),
  body('avatar').optional().isString().withMessage('Avatar must be a URL string'),
];
