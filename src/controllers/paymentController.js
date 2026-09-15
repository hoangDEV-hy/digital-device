const { Order, OrderItem, Payment, License, Product } = require('../models');

// Create a mock payment for an order (client initiates)
exports.createPayment = async (req, res, next) => {
  try {
    const { orderId, method } = req.body;
    const order = await Order.findByPk(orderId, { include: [OrderItem] });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const payment = await Payment.create({ orderId, method, status: 'pending' });
    // Return a mock payment URL (simulate redirect to provider)
    const mockUrl = `/api/payments/mock-ipn?orderId=${orderId}&status=success&providerTxId=MOCK123`;
    res.json({ success: true, message: 'Payment initiated', data: { paymentId: payment.id, redirectUrl: mockUrl } });
  } catch (err) { next(err); }
};

// Mock IPN endpoint — provider calls this to notify payment result
exports.mockIpn = async (req, res, next) => {
  try {
    const { orderId, status, providerTxId } = req.query;
    const order = await Order.findByPk(orderId, { include: [OrderItem] });
    if (!order) return res.status(404).send('Order not found');
    // Create or update payment
    let payment = await Payment.findOne({ where: { orderId } });
    if (!payment) payment = await Payment.create({ orderId, method: 'mock', status: status });
    else payment.status = status;
    payment.providerTxId = providerTxId || payment.providerTxId;
    if (status === 'success') {
      payment.status = 'success';
      payment.paidAt = new Date();
      await payment.save();
      order.status = 'paid';
      await order.save();
      // Generate licenses for each order item
      for (const item of await OrderItem.findAll({ where: { orderId } })) {
        await License.create({ userId: order.userId, productId: item.productId, orderId: order.id });
      }
      return res.send('OK');
    }
    await payment.save();
    res.send('OK');
  } catch (err) { next(err); }
};
