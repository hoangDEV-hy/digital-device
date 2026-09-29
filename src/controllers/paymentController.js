const { Order, OrderItem, Payment, License, Product, Wallet, WalletTransaction, Notification } = require('../models');

const toMoney = (value) => Number(parseFloat(value || 0).toFixed(2));

const ensureWallet = async (userId) => {
  let wallet = await Wallet.findOne({ where: { userId } });
  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      balance: 0,
      escrowBalance: 0,
      depositBalance: 0,
      contractStatus: 'inactive',
      minimumDeposit: 100000,
    });
  }
  return wallet;
};

const calculateSellerTotals = (orderItems = []) => {
  const totals = {};

  for (const item of orderItems) {
    const product = item.Product || item.product || null;
    const sellerId = product?.sellerId || item.sellerId;
    if (!sellerId) continue;

    const unitPrice = Number(item.price || 0);
    const quantity = Number(item.quantity || 1);
    const amount = toMoney(unitPrice * quantity);
    totals[sellerId] = toMoney((totals[sellerId] || 0) + amount);
  }

  return totals;
};

const buildMockPaymentUrl = (orderId, providerTxId) => {
  const txId = providerTxId || `PENDING-${Date.now()}`;
  return `/api/payments/mock-ipn?orderId=${orderId}&status=success&providerTxId=${encodeURIComponent(txId)}`;
};

const canBuyerAfford = (wallet = {}, totalAmount = 0) => {
  const balance = Number(wallet.balance || 0);
  const total = Number(totalAmount || 0);
  return balance >= total;
};

const createOrderLicenseBatch = async (order, orderItems = []) => {
  const created = [];
  for (const item of orderItems) {
    const existing = await License.findOne({ where: { userId: order.userId, productId: item.productId, orderId: order.id } });
    if (!existing) {
      const license = await License.create({ userId: order.userId, productId: item.productId, orderId: order.id, status: 'active' });
      created.push(license);
    }

    const product = await Product.findByPk(item.productId);
    if (product) {
      await Notification.create({ userId: order.userId, type: 'payment_success', channel: 'email', payload: { orderId: order.id, productId: product.id } });
      await Notification.create({ userId: product.sellerId, type: 'product_sold', channel: 'in-app', payload: { orderId: order.id, productId: product.id } });
    }
  }

  return created;
};

const finalizeSuccessfulOrderPayment = async (order, payment, { topUpBuyerWallet = false } = {}) => {
  if (!order) throw new Error('Order not found');
  if (order.status === 'paid' && payment && payment.status === 'success') {
    return { order, payment, alreadyProcessed: true };
  }

  const orderTotal = toMoney(order.totalAmount || 0);
  const buyerWallet = await ensureWallet(order.userId);

  if (topUpBuyerWallet) {
    const currentBalance = toMoney(buyerWallet.balance || 0);
    const missingAmount = Math.max(0, orderTotal - currentBalance);

    if (missingAmount > 0) {
      buyerWallet.balance = toMoney(currentBalance + missingAmount);
      await buyerWallet.save();
      await WalletTransaction.create({
        walletId: buyerWallet.id,
        userId: order.userId,
        type: 'deposit',
        amount: missingAmount,
        relatedOrderId: order.id,
        note: `Top-up for order ${order.id}`,
        status: 'success',
      });
    }
  }

  if (!canBuyerAfford(buyerWallet, orderTotal)) {
    throw new Error('Buyer balance insufficient to finalize order payment');
  }

  buyerWallet.balance = toMoney((Number(buyerWallet.balance || 0) - orderTotal));
  await buyerWallet.save();
  await WalletTransaction.create({
    walletId: buyerWallet.id,
    userId: order.userId,
    type: 'withdrawal',
    amount: orderTotal,
    relatedOrderId: order.id,
    note: `Order payment for ${order.id}`,
    status: 'success',
  });

  const orderItems = await OrderItem.findAll({ where: { orderId: order.id }, include: [Product] });
  const sellerTotals = calculateSellerTotals(orderItems);

  for (const [sellerId, amount] of Object.entries(sellerTotals)) {
    const sellerWallet = await ensureWallet(sellerId);
    sellerWallet.escrowBalance = toMoney((Number(sellerWallet.escrowBalance || 0) + amount));
    await sellerWallet.save();
    await WalletTransaction.create({
      walletId: sellerWallet.id,
      userId: sellerId,
      type: 'escrow_hold',
      amount,
      relatedOrderId: order.id,
      note: `Escrow hold for order ${order.id}`,
      status: 'success',
    });
  }

  order.status = 'paid';
  await order.save();

  payment.status = 'success';
  payment.providerTxId = payment.providerTxId || `MOCK-${Date.now()}`;
  payment.paidAt = new Date();
  await payment.save();

  await createOrderLicenseBatch(order, orderItems);

  return { order, payment, alreadyProcessed: false };
};

// Create a mock payment for an order (client initiates)
exports.createPayment = async (req, res, next) => {
  try {
    const { orderId, method } = req.body;
    const order = await Order.findByPk(orderId, { include: [{ model: OrderItem, include: [Product] }] });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const payment = await Payment.findOne({ where: { orderId } });
    const orderTotal = toMoney(order.totalAmount || 0);
    const buyerWallet = await ensureWallet(order.userId);

    if (order.status === 'paid' && payment && payment.status === 'success') {
      return res.json({ success: true, message: 'Order already paid', data: { orderId, paymentId: payment.id, status: payment.status } });
    }

    if (canBuyerAfford(buyerWallet, orderTotal)) {
      const activePayment = payment || await Payment.create({ orderId, method: method || 'mock', status: 'pending' });
      await finalizeSuccessfulOrderPayment(order, activePayment, { topUpBuyerWallet: false });
      return res.json({
        success: true,
        message: 'Order paid successfully using buyer wallet balance',
        data: { orderId, paymentId: activePayment.id, status: activePayment.status, totalAmount: orderTotal },
      });
    }

    const pendingPayment = payment || await Payment.create({ orderId, method: method || 'mock', status: 'pending' });
    pendingPayment.status = 'pending';
    pendingPayment.method = method || pendingPayment.method || 'mock';
    pendingPayment.providerTxId = pendingPayment.providerTxId || `PENDING-${Date.now()}`;
    await pendingPayment.save();

    const mockUrl = buildMockPaymentUrl(orderId, pendingPayment.providerTxId);
    res.json({
      success: true,
      message: 'Insufficient wallet balance. Please top up or complete payment to continue.',
      data: {
        paymentId: pendingPayment.id,
        status: pendingPayment.status,
        redirectUrl: mockUrl,
        requiredAmount: orderTotal,
      },
    });
  } catch (err) { next(err); }
};

// Mock IPN endpoint — provider calls this to notify payment result
exports.mockIpn = async (req, res, next) => {
  try {
    const { orderId, status, providerTxId } = req.query;
    const order = await Order.findByPk(orderId, { include: [{ model: OrderItem, include: [Product] }] });
    if (!order) return res.status(404).send('Order not found');

    let payment = await Payment.findOne({ where: { orderId } });
    if (!payment) payment = await Payment.create({ orderId, method: 'mock', status: 'pending' });

    if (order.status === 'paid' && payment.status === 'success') {
      payment.providerTxId = providerTxId || payment.providerTxId;
      await payment.save();
      return res.send('OK');
    }

    payment.status = status || payment.status;
    payment.providerTxId = providerTxId || payment.providerTxId;

    if (status === 'success') {
      const topUpBuyerWallet = true;
      await finalizeSuccessfulOrderPayment(order, payment, { topUpBuyerWallet });
      return res.send('OK');
    }

    payment.status = 'failed';
    payment.paidAt = null;
    await payment.save();
    return res.send('OK');
  } catch (err) { next(err); }
};

exports.calculateSellerTotals = calculateSellerTotals;
exports.canBuyerAfford = canBuyerAfford;
exports.buildMockPaymentUrl = buildMockPaymentUrl;
