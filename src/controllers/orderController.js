const { Order, OrderItem, Product, User, Cart, CartItem } = require('../models');

exports.checkoutFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.user.id, status: 'active' },
      include: [{ model: CartItem, include: [{ model: Product }] }],
    });

    if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    let totalAmount = 0;
    for (const item of cart.CartItems) {
      totalAmount += Number(item.price) * Number(item.quantity);
    }

    const order = await Order.create({
      userId: req.user.id,
      totalAmount,
      status: 'pending',
    });

    await Promise.all(
      cart.CartItems.map((item) =>
        OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          price: item.price,
          quantity: item.quantity,
        })
      )
    );

    cart.status = 'ordered';
    await cart.save();

    res.json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        totalAmount,
        status: order.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['id', 'title', 'price', 'thumbnail', 'type'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

exports.getOrdersForMyProducts = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'fullName', 'email'],
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              where: { sellerId: req.user.id },
              required: true,
              attributes: ['id', 'title', 'price', 'thumbnail', 'type', 'sellerId'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'fullName', 'email'],
        },
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['id', 'title', 'price', 'thumbnail', 'type', 'sellerId'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};
