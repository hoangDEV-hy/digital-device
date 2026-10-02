const { sequelize, Order, OrderItem, Payment, License, Product, User, Wallet, WalletTransaction, Notification } = require('../models');
const { Op } = require('sequelize');
const { calculateLineSettlement } = require('../utils/commission');

const toMoney = (value) => Number(parseFloat(value || 0).toFixed(2));

const ensureWallet = async (userId, transaction) => {
  let wallet = await Wallet.findOne({ where: { userId }, transaction });
  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      balance: 0,
      escrowBalance: 0,
      depositBalance: 0,
      contractStatus: 'inactive',
      minimumDeposit: 50000000,
    }, { transaction });
  }
  return wallet;
};

const calculateSellerTotals = (orderItems = []) => {
  const totals = {};

  for (const item of orderItems) {
    const product = item.Product || item.product || null;
    const sellerId = product?.sellerId || item.sellerId;
    if (!sellerId) continue;

    const quantity = Number(item.quantity || 1);
    const { sellerNet } = calculateLineSettlement(item.price, quantity);
    totals[sellerId] = toMoney((totals[sellerId] || 0) + sellerNet);
  }

  return totals;
};

const calculatePlatformCommission = (orderItems = []) => orderItems.reduce((total, item) => {
  const { commission } = calculateLineSettlement(item.price, Number(item.quantity || 1));
  return toMoney(total + commission);
}, 0);

const buildMockPaymentUrl = (orderId, providerTxId) => {
  const txId = providerTxId || `PENDING-${Date.now()}`;
  return `/api/payments/mock-ipn?orderId=${orderId}&status=success&providerTxId=${encodeURIComponent(txId)}`;
};

const canBuyerAfford = (wallet = {}, totalAmount = 0) => {
  const balance = Number(wallet.balance || 0);
  const total = Number(totalAmount || 0);
  return balance >= total;
};

const createOrderLicenseBatch = async (order, orderItems = [], transaction) => {
  const created = [];
  for (const item of orderItems) {
    const existing = await License.findOne({ where: { userId: order.userId, productId: item.productId, orderId: order.id }, transaction });
    if (!existing) {
      const license = await License.create({ userId: order.userId, productId: item.productId, orderId: order.id, status: 'active' }, { transaction });
      created.push(license);
    }

    const product = item.Product || await Product.findByPk(item.productId, { transaction });
    if (product) {
      await Notification.create({ userId: order.userId, type: 'payment_success', channel: 'email', payload: { orderId: order.id, productId: product.id } }, { transaction });
      await Notification.create({ userId: product.sellerId, type: 'product_sold', channel: 'in-app', payload: { orderId: order.id, productId: product.id } }, { transaction });
    }
  }

  return created;
};

const finalizeSuccessfulOrderPayment = async (order, payment, { topUpBuyerWallet = false, providerTxId } = {}) => {
  if (!order) throw new Error('Order not found');
  return sequelize.transaction(async (transaction) => {
    const currentOrder = await Order.findByPk(order.id, { transaction, lock: transaction.LOCK.UPDATE });
    const currentPayment = await Payment.findByPk(payment.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!currentOrder || !currentPayment) throw new Error('Order or payment not found');
    if (currentOrder.status === 'paid' && currentPayment.status === 'success') {
      return { order: currentOrder, payment: currentPayment, alreadyProcessed: true };
    }

    const orderItems = await OrderItem.findAll({ where: { orderId: currentOrder.id }, include: [Product], transaction });
    for (const item of orderItems) {
      const quantity = Number(item.quantity || 1);
      if (!Number.isSafeInteger(quantity) || quantity < 1) {
        const error = new Error('Order contains an invalid product quantity');
        error.status = 400;
        throw error;
      }
      const [updatedCount] = await Product.update(
        { stock: sequelize.literal(`stock - ${quantity}`) },
        { where: { id: item.productId, stock: { [Op.gte]: quantity } }, transaction },
      );
      if (updatedCount !== 1) {
        const error = new Error(`Insufficient stock for ${item.Product?.title || 'a product in this order'}`);
        error.status = 409;
        throw error;
      }
    }

    const orderTotal = toMoney(currentOrder.totalAmount || 0);
    const buyerWallet = await ensureWallet(currentOrder.userId, transaction);

    if (topUpBuyerWallet) {
      const currentBalance = toMoney(buyerWallet.balance || 0);
      const missingAmount = Math.max(0, orderTotal - currentBalance);

      if (missingAmount > 0) {
        buyerWallet.balance = toMoney(currentBalance + missingAmount);
        await buyerWallet.save({ transaction });
        await WalletTransaction.create({
          walletId: buyerWallet.id,
          userId: currentOrder.userId,
          type: 'deposit',
          amount: missingAmount,
          relatedOrderId: currentOrder.id,
          note: `Top-up for order ${currentOrder.id}`,
          status: 'success',
        }, { transaction });
      }
    }

    if (!canBuyerAfford(buyerWallet, orderTotal)) {
      throw new Error('Buyer balance insufficient to finalize order payment');
    }

    buyerWallet.balance = toMoney((Number(buyerWallet.balance || 0) - orderTotal));
    await buyerWallet.save({ transaction });
    await WalletTransaction.create({
      walletId: buyerWallet.id,
      userId: currentOrder.userId,
      type: 'withdrawal',
      amount: orderTotal,
      relatedOrderId: currentOrder.id,
      note: `Order payment for ${currentOrder.id}`,
      status: 'success',
    }, { transaction });

    const sellerTotals = calculateSellerTotals(orderItems);
    for (const [sellerId, amount] of Object.entries(sellerTotals)) {
      const sellerWallet = await ensureWallet(sellerId, transaction);
      sellerWallet.escrowBalance = toMoney((Number(sellerWallet.escrowBalance || 0) + amount));
      await sellerWallet.save({ transaction });
      await WalletTransaction.create({
        walletId: sellerWallet.id,
        userId: sellerId,
        type: 'escrow_hold',
        amount,
        relatedOrderId: currentOrder.id,
        note: `Seller net after 2% commission for order ${currentOrder.id}`,
        status: 'success',
      }, { transaction });
    }

    const commissionTotal = calculatePlatformCommission(orderItems);
    if (commissionTotal > 0) {
      const admin = await User.findOne({ where: { role: 'admin' }, order: [['createdAt', 'ASC']], transaction });
      if (!admin) throw new Error('Admin account is required to receive marketplace commission');
      const adminWallet = await ensureWallet(admin.id, transaction);
      adminWallet.balance = toMoney(Number(adminWallet.balance || 0) + commissionTotal);
      await adminWallet.save({ transaction });
      await WalletTransaction.create({
        walletId: adminWallet.id,
        userId: admin.id,
        type: 'commission',
        amount: commissionTotal,
        relatedOrderId: currentOrder.id,
        note: `2% marketplace commission for order ${currentOrder.id}`,
        status: 'success',
      }, { transaction });
    }

    currentOrder.status = 'paid';
    await currentOrder.save({ transaction });

    currentPayment.status = 'success';
    currentPayment.providerTxId = providerTxId || currentPayment.providerTxId || `MOCK-${Date.now()}`;
    currentPayment.paidAt = new Date();
    await currentPayment.save({ transaction });

    await createOrderLicenseBatch(currentOrder, orderItems, transaction);
    return { order: currentOrder, payment: currentPayment, alreadyProcessed: false };
  });
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
      const finalized = await finalizeSuccessfulOrderPayment(order, activePayment, { topUpBuyerWallet: false });
      return res.json({
        success: true,
        message: 'Order paid successfully using buyer wallet balance',
        data: { orderId, paymentId: activePayment.id, status: finalized.payment.status, totalAmount: orderTotal },
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

/*
  cơ chế
  API 1 — /create-tạo thanh toán
  API 2 — /mock-ipn-việc server sẽ làm sau khi thanh toán thành công/ thất bại
  -->chưa có cơ chế kiểm tra thanh toán thành công hay chưa?
*/ 

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

    if (status === 'success') {
      const topUpBuyerWallet = true;
      await finalizeSuccessfulOrderPayment(order, payment, { topUpBuyerWallet, providerTxId });
      return res.send('OK');
    }

    payment.status = 'failed';
    payment.providerTxId = providerTxId || payment.providerTxId;
    payment.paidAt = null;
    await payment.save();
    return res.send('OK');
  } catch (err) { next(err); }
};

exports.calculateSellerTotals = calculateSellerTotals;
exports.calculatePlatformCommission = calculatePlatformCommission;
exports.canBuyerAfford = canBuyerAfford;
exports.buildMockPaymentUrl = buildMockPaymentUrl;
