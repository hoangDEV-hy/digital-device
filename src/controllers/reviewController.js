const { Review, Product, License, User } = require('../models');
const { Op } = require('sequelize');

exports.createReview = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const { rating, content } = req.body;
    const userId = req.user.id;

    if (!productId || !rating || !content) {
      return res.status(400).json({ success: false, message: 'productId, rating and content are required' });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const hasLicense = await License.findOne({
      where: {
        userId,
        productId,
        status: 'active',
      },
    });

    if (!hasLicense) {
      return res.status(403).json({ success: false, message: 'You can only review products you have purchased and own a valid license for.' });
    }

    const existingReview = await Review.findOne({
      where: { userId, productId },
      paranoid: false,
    });

    if (existingReview) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this product.' });
    }

    const review = await Review.create({
      userId,
      productId,
      rating: Number(rating),
      content,
      status: 'visible',
    });

    res.status(201).json({ success: true, message: 'Review created successfully', data: review });
  } catch (err) {
    next(err);
  }
};

exports.listProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reviews = await Review.findAll({
      where: { productId },
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'avatar'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};

exports.listMySellerReviews = async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      include: [
        {
          model: Product,
          where: { sellerId: req.user.id },
          attributes: ['id', 'title', 'thumbnail'],
        },
        { model: User, as: 'user', attributes: ['id', 'fullName', 'avatar'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};

exports.removeReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findByPk(reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    if(req.user.id !== review.userId && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'You are not the owner of this review' });
    }
    await review.destroy();
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = exports;
