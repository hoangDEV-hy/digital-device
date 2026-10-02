const { Cart, CartItem, Product, Order, OrderItem } = require('../models');

exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ where: { userId: req.user.id, status: 'active' }, include: [{ model: CartItem, include: [Product] }] });
    if (!cart) {
      cart = await Cart.create({ userId: req.user.id });
    }
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
};

exports.addItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const requestedQuantity = quantity === undefined ? 1 : Number(quantity);
    if (!Number.isSafeInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
    }
    if (requestedQuantity > product.stock) {
      return res.status(409).json({ success: false, message: 'Requested quantity exceeds available stock' });
    }
    let cart = await Cart.findOne({ where: { userId: req.user.id, status: 'active' } });
    if (!cart) cart = await Cart.create({ userId: req.user.id });
    const item = await CartItem.create({ cartId: cart.id, productId, price: product.price, quantity: requestedQuantity });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
};

exports.removeItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const item = await CartItem.findByPk(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    await item.destroy();
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.checkout = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id, status: 'active' }, include: [{ model: CartItem, include: [Product] }] });
    if (!cart || cart.CartItems.length === 0) return res.status(400).json({ success: false, message: 'Cart empty' });
    for (const item of cart.CartItems) {
      if (!item.Product || Number(item.quantity) > Number(item.Product.stock)) {
        return res.status(409).json({ success: false, message: `Insufficient stock for ${item.Product?.title || 'a product in your cart'}` });
      }
    }
    // create order
    let total = 0;
    for (const it of cart.CartItems) total += parseFloat(it.price) * it.quantity;
    const order = await Order.create({ userId: req.user.id, totalAmount: total, status: 'pending' });
    for (const it of cart.CartItems) {
      await OrderItem.create({ orderId: order.id, productId: it.productId, price: it.price, quantity: it.quantity });
    }
    // mark cart as ordered
    cart.status = 'ordered';
    await cart.save();
    res.json({ success: true, data: { orderId: order.id, totalAmount: total } });
  } catch (err) { next(err); }
};
