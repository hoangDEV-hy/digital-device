const { sequelize, Wallet, WalletTransaction, WithdrawalRequest, User, Order, OrderItem, Product, Notification, License } = require('../models');
const { Op } = require('sequelize');
const { addMoney } = require('../utils/money');

const DEFAULT_MIN_DEPOSIT = 100000;
const MIN_WITHDRAWAL = 10000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const toMoney = (value) => Number(parseFloat(value || 0).toFixed(2));

const calculateEscrowReleasePlan = (orderItems = [], sellerEscrowMap = {}) => {
  const totals = {};
  for (const item of orderItems) {
    const product = item.Product || item.product || null;
    const sellerId = product?.sellerId || item.sellerId;
    if (!sellerId) continue;

    const amount = toMoney((Number(item.price || 0) * Number(item.quantity || 1)));
    totals[sellerId] = toMoney((totals[sellerId] || 0) + amount);
  }

  const plan = {};
  for (const [sellerId, total] of Object.entries(totals)) {
    const escrowAvailable = toMoney(sellerEscrowMap[sellerId] ?? total);
    const releaseAmount = Math.min(total, escrowAvailable);
    if (releaseAmount > 0) {
      plan[sellerId] = releaseAmount;
    }
  }

  return plan;
};

const ensureWallet = async (userId) => {
  let wallet = await Wallet.findOne({ where: { userId } });
  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      balance: 0,
      escrowBalance: 0,
      depositBalance: 0,
      contractStatus: 'inactive',
      minimumDeposit: DEFAULT_MIN_DEPOSIT,
    });
  }
  return wallet;
};

const createNotification = async (userId, type, payload, channel = 'in-app') => {
  if (!userId) return null;
  return Notification.create({ userId, type, channel, payload });
};

const applySellerContractRules = async (user, wallet, reason = 'deposit policy') => {
  const minimum = toMoney(wallet.minimumDeposit || DEFAULT_MIN_DEPOSIT);
  const depositBelowMinimum = wallet.depositBalance < minimum;
  const negativeDeposit = wallet.depositBalance < 0;

  if (depositBelowMinimum || negativeDeposit) {
    wallet.contractStatus = 'suspended';
    if (negativeDeposit) user.status = 'locked';
    await wallet.save();
    await user.save();
    await WalletTransaction.create({
      walletId: wallet.id,
      userId: user.id,
      type: 'penalty',
      amount: Math.abs(toMoney(wallet.depositBalance) - minimum),
      note: `Seller contract suspended: ${reason}`,
      status: 'success',
    });
    return true;
  }

  if (wallet.contractStatus !== 'registered') {
    wallet.contractStatus = 'registered';
    await wallet.save();
    await user.save();
  }

  return false;
};

const hasOpenRefundWindow = async (userId) => {
  return Order.findOne({
    where: {
      createdAt: { [Op.gte]: new Date(Date.now() - SEVEN_DAYS_MS) },
      status: { [Op.in]: ['paid', 'pending'] },
    },
    include: [{
      model: OrderItem,
      required: true,
      include: [{
        model: Product,
        where: { sellerId: userId },
        required: true,
      }],
    }],
  });
};

exports.getWalletSummary = async (req, res, next) => {
  try {
    const wallet = await ensureWallet(req.user.id);
    res.json({ success: true, data: wallet });
  } catch (err) { next(err); }
};

exports.depositFunds = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const amountNum = toMoney(amount);

    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }

    const wallet = await ensureWallet(req.user.id);
    wallet.balance = addMoney(wallet.balance, amountNum);
    await wallet.save();

    await WalletTransaction.create({
      walletId: wallet.id,
      userId: req.user.id,
      type: 'deposit',
      amount: amountNum,
      note: 'Wallet deposit',
      status: 'success',
    });

    res.json({ success: true, message: 'Deposit successful', data: wallet });
  } catch (err) { next(err); }
};

exports.listTransactions = async (req, res, next) => {
  try {
    const wallet = await ensureWallet(req.user.id);
    const items = await WalletTransaction.findAll({
      where: { walletId: wallet.id },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

exports.registerSellerContract = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.status === 'locked') return res.status(403).json({ success: false, message: 'Account is locked' });

    const wallet = await ensureWallet(user.id);
    const minimum = toMoney(wallet.minimumDeposit || DEFAULT_MIN_DEPOSIT);
    const depositAmount = toMoney(req.body.amount ?? minimum);

    if (depositAmount < minimum) {
      return res.status(400).json({ success: false, message: `Seller deposit must be at least ${minimum} VND` });
    }
    if (wallet.balance < depositAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance. Please deposit more funds before registering the seller contract.' });
    }
    if (wallet.contractStatus === 'registered') {
      return res.status(400).json({ success: false, message: 'Seller contract already registered' });
    }

    wallet.balance = toMoney((Number(wallet.balance || 0) - depositAmount));
    wallet.depositBalance = toMoney((Number(wallet.depositBalance || 0) + depositAmount));
    wallet.contractStatus = 'registered';

    await wallet.save();
    await user.save();

    await WalletTransaction.create({
      walletId: wallet.id,
      userId: user.id,
      type: 'contract_register',
      amount: depositAmount,
      note: 'Seller contract registered with deposit',
      status: 'success',
    });

    await createNotification(user.id, 'seller_contract_registered', { walletId: wallet.id, depositAmount }, 'email');
    res.json({ success: true, message: 'Seller contract registered', data: { wallet, user } });
  } catch (err) { next(err); }
};

exports.cancelSellerContract = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const wallet = await ensureWallet(user.id);

    if (wallet.contractStatus !== 'registered') {
      return res.status(400).json({ success: false, message: 'Seller contract not active' });
    }

    const openOrder = await hasOpenRefundWindow(user.id);
    if (openOrder) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel seller contract while there are orders inside the 7-day refund window.',
      });
    }

    const refundAmount = toMoney(wallet.depositBalance || 0);
    wallet.depositBalance = 0;
    wallet.balance = toMoney((Number(wallet.balance || 0) + refundAmount));
    wallet.contractStatus = 'inactive';

    await wallet.save();
    await user.save();

    await WalletTransaction.create({
      walletId: wallet.id,
      userId: user.id,
      type: 'contract_cancel',
      amount: refundAmount,
      note: 'Seller contract cancelled and deposit returned after refund window closed',
      status: 'success',
    });

    await createNotification(user.id, 'seller_contract_cancelled', { refundAmount }, 'email');
    res.json({ success: true, message: 'Contract cancelled and deposit returned', data: wallet });
  } catch (err) { next(err); }
};

exports.requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, bankName, bankAccount, accountHolder } = req.body;
    const amountNum = toMoney(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    if (amountNum < MIN_WITHDRAWAL) {
      return res.status(400).json({ success: false, message: 'Withdrawal amount below minimum withdrawal' });
    }
    if (!bankName?.trim() || !bankAccount?.trim() || !accountHolder?.trim()) {
      return res.status(400).json({ success: false, message: 'Bank details are required: bankName, bankAccount, accountHolder' });
    }
    const transaction = await sequelize.transaction();
    try {
      const wallet = await Wallet.findOne({
        where: { userId: req.user.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!wallet) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Wallet not found' });
      }
      const available = toMoney(wallet.balance || 0);
      if (amountNum > available) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
      }

      wallet.balance = toMoney(available - amountNum);
      await wallet.save({ transaction });
      const request = await WithdrawalRequest.create({
        userId: req.user.id,
        walletId: wallet.id,
        amount: amountNum,
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        accountHolder: accountHolder.trim(),
      }, { transaction });
      await WalletTransaction.create({
        walletId: wallet.id,
        userId: req.user.id,
        relatedWithdrawalRequestId: request.id,
        type: 'withdrawal',
        amount: amountNum,
        note: `Withdrawal request to ${bankName.trim()} (${accountHolder.trim()})`,
        status: 'pending',
      }, { transaction });
      await transaction.commit();
      return res.status(201).json({ success: true, message: 'Withdrawal request submitted', data: { request, wallet } });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) { next(err); }
};

exports.withdrawFunds = exports.requestWithdrawal;

exports.listMyWithdrawalRequests = async (req, res, next) => {
  try {
    const requests = await WithdrawalRequest.findAll({
      where: { userId: req.user.id },
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'fullName'] }],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data: requests });
  } catch (err) { next(err); }
};

exports.listWithdrawalRequests = async (req, res, next) => {
  try {
    const where = {};
    if (['pending', 'approved', 'rejected'].includes(req.query.status)) where.status = req.query.status;
    const requests = await WithdrawalRequest.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email'] }],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data: requests });
  } catch (err) { next(err); }
};

async function reviewWithdrawal(req, res, next, status) {
  const transaction = await sequelize.transaction();
  try {
    const request = await WithdrawalRequest.findByPk(req.params.requestId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!request) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }
    if (request.status !== 'pending') {
      await transaction.rollback();
      return res.status(409).json({ success: false, message: 'Withdrawal request has already been reviewed' });
    }

    const walletTransaction = await WalletTransaction.findOne({
      where: { relatedWithdrawalRequestId: request.id, status: 'pending' },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!walletTransaction) throw new Error('Pending withdrawal transaction not found');

    if (status === 'rejected') {
      const wallet = await Wallet.findByPk(request.walletId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!wallet) throw new Error('Wallet not found');
      wallet.balance = toMoney(Number(wallet.balance || 0) + Number(request.amount));
      await wallet.save({ transaction });
      walletTransaction.status = 'failed';
      walletTransaction.note = `Withdrawal request rejected: ${req.body.note?.trim() || 'No reason provided'}`;
      await walletTransaction.save({ transaction });
      await WalletTransaction.create({
        walletId: wallet.id,
        userId: request.userId,
        relatedWithdrawalRequestId: request.id,
        type: 'refund',
        amount: request.amount,
        note: 'Refund for rejected withdrawal request',
        status: 'success',
      }, { transaction });
    } else {
      walletTransaction.status = 'success';
      await walletTransaction.save({ transaction });
    }

    request.status = status;
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    request.adminNote = req.body.note?.trim() || null;
    await request.save({ transaction });
    await transaction.commit();
    return res.json({ success: true, data: request });
  } catch (err) {
    await transaction.rollback();
    return next(err);
  }
}

exports.approveWithdrawalRequest = (req, res, next) => reviewWithdrawal(req, res, next, 'approved');
exports.rejectWithdrawalRequest = (req, res, next) => reviewWithdrawal(req, res, next, 'rejected');

exports.updateWalletBalance = async (req, res, next) => {
  try {
    const { amount, type, note, userId } = req.body;
    const targetUserId = userId || req.user?.id;
    if (!targetUserId) return res.status(400).json({ success: false, message: 'User id is required' });

    const wallet = await ensureWallet(targetUserId);
    const amountVal = toMoney(amount || 0);

    if (type === 'deposit') {
      wallet.balance = toMoney((Number(wallet.balance || 0) + amountVal));
    } else if (type === 'escrow_hold') {
      wallet.escrowBalance = toMoney((Number(wallet.escrowBalance || 0) + amountVal));
      wallet.balance = toMoney((Number(wallet.balance || 0) - amountVal));
    } else if (type === 'escrow_release') {
      wallet.escrowBalance = toMoney((Number(wallet.escrowBalance || 0) - amountVal));
      wallet.balance = toMoney((Number(wallet.balance || 0) + amountVal));
    } else if (type === 'penalty') {
      wallet.balance = toMoney((Number(wallet.balance || 0) - amountVal));
      wallet.depositBalance = toMoney((Number(wallet.depositBalance || 0) - amountVal));
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported wallet type' });
    }

    await wallet.save();
    await WalletTransaction.create({
      walletId: wallet.id,
      userId: targetUserId,
      type,
      amount: amountVal,
      note: note || 'Manual wallet update',
      status: 'success',
    });

    const user = await User.findByPk(targetUserId);
    if (user) {
      await applySellerContractRules(user, wallet, 'manual wallet update');
    }

    res.json({ success: true, data: wallet });
  } catch (err) { next(err); }
};

exports.holdEscrowOnSale = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.body;
    const order = await Order.findByPk(orderId, { include: [{ model: User, attributes: ['id', 'fullName'] }] });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const wallet = await ensureWallet(userId);
    const amount = toMoney(order.totalAmount || 0);
    wallet.escrowBalance = toMoney((Number(wallet.escrowBalance || 0) + amount));
    wallet.balance = toMoney((Number(wallet.balance || 0) - amount));
    await wallet.save();

    await WalletTransaction.create({
      walletId: wallet.id,
      userId,
      type: 'escrow_hold',
      amount,
      relatedOrderId: order.id,
      note: `Escrow hold for order ${order.id}`,
      status: 'success',
    });

    await createNotification(userId, 'escrow_held', { orderId: order.id, amount }, 'in-app');
    res.json({ success: true, data: wallet });
  } catch (err) { next(err); }
};

exports.releaseEscrowAfterSevenDays = async (req, res, next) => {
  try {
    const { orderId } = req.body || {};
    const orderController = require('./orderController');

    if (orderId) {
      const order = await Order.findByPk(orderId, { include: [{ model: OrderItem, include: [Product] }] });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      if (order.status !== 'paid') return res.status(400).json({ success: false, message: 'Order must be paid before escrow can be released' });
      if (order.escrowReleased) return res.status(400).json({ success: false, message: 'Already released' });

      const now = Date.now();
      const orderAge = now - new Date(order.createdAt).getTime();
      if (orderAge < SEVEN_DAYS_MS) {
        return res.status(400).json({ success: false, message: 'Escrow not yet releasable' });
      }

      const itemTotals = {};
      for (const item of order.OrderItems || []) {
        const sellerId = item.Product?.sellerId || item.sellerId;
        if (!sellerId) continue;
        const amount = toMoney((Number(item.price || 0) * Number(item.quantity || 1)));
        itemTotals[sellerId] = toMoney((itemTotals[sellerId] || 0) + amount);
      }

      const sellerIds = Object.keys(itemTotals);
      if (sellerIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No escrowed seller funds for this order' });
      }

      const results = [];
      let totalReleased = 0;
      for (const sellerId of sellerIds) {
        const wallet = await ensureWallet(sellerId);
        const escrowLocked = toMoney(wallet.escrowBalance || 0);
        const releaseAmount = Math.min(toMoney(itemTotals[sellerId] || 0), escrowLocked);

        if (releaseAmount <= 0) {
          results.push({ sellerId, released: 0, escrowBalance: wallet.escrowBalance || 0, skipped: true });
          continue;
        }

        const platformFee = toMoney(releaseAmount * 0.1);
        const sellerReceived = toMoney(releaseAmount - platformFee);

        wallet.escrowBalance = toMoney((wallet.escrowBalance || 0) - releaseAmount);
        wallet.balance = addMoney(wallet.balance, sellerReceived);
        await wallet.save();

        await WalletTransaction.create({
          walletId: wallet.id,
          userId: sellerId,
          type: 'escrow_release',
          amount: sellerReceived,
          relatedOrderId: order.id,
          note: `Escrow released after 7 days for order ${order.id}; platform fee ${platformFee}`,
          status: 'success',
        });

        await createNotification(sellerId, 'escrow_released', { orderId: order.id, amount: sellerReceived, platformFee }, 'email');
        totalReleased += sellerReceived;
        results.push({ sellerId, released: sellerReceived, escrowBalance: wallet.escrowBalance, platformFee, skipped: false });
      }

      order.escrowReleased = true;
      order.releasedAt = new Date();
      await order.save();

      return res.json({ success: true, message: 'Escrow released per seller', data: { orderId: order.id, totalReleased, releases: results } });
    }

    return orderController.releaseEscrowForEligibleOrders(req, res, next);
  } catch (err) { next(err); }
};

exports.processReturn = async (req, res, next) => {
  try {
    const { orderId, refundAmount, returnType, requestedAt } = req.body;
    const order = await Order.findByPk(orderId, { include: [{ model: OrderItem, include: [Product] }] });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden: you can only refund your own order' });
    if (order.status === 'cancelled') return res.status(400).json({ success: false, message: 'Already refunded' });
    if (order.escrowReleased) return res.status(400).json({ success: false, message: 'Refund period has expired' });

    const refundRequestTime = new Date(requestedAt || Date.now());
    const orderCreatedAt = new Date(order.createdAt);
    const beforeSevenDays = (refundRequestTime.getTime() - orderCreatedAt.getTime()) < SEVEN_DAYS_MS;
    const effectiveType = returnType || (beforeSevenDays ? 'before_7_days' : 'after_7_days');
    const amount = toMoney(refundAmount ?? order.totalAmount ?? 0);

    const buyerWallet = await ensureWallet(req.user.id);
    const itemTotals = {};
    for (const item of order.OrderItems || []) {
      const sellerId = item.Product?.sellerId || item.sellerId;
      if (!sellerId) continue;
      const itemAmount = toMoney((Number(item.price || 0) * Number(item.quantity || 1)));
      itemTotals[sellerId] = toMoney((itemTotals[sellerId] || 0) + itemAmount);
    }

    let totalSellerRefund = 0;
    for (const [sellerId, sellerTotal] of Object.entries(itemTotals)) {
      const sellerWallet = await ensureWallet(sellerId);
      const sellerRefund = Math.min(amount, sellerTotal, toMoney(sellerWallet.escrowBalance || 0));
      if (sellerRefund > 0) {
        sellerWallet.escrowBalance = toMoney((Number(sellerWallet.escrowBalance || 0) - sellerRefund));
        await sellerWallet.save();

        await WalletTransaction.create({
          walletId: sellerWallet.id,
          userId: sellerId,
          type: 'refund',
          amount: sellerRefund,
          relatedOrderId: order.id,
          note: `Refund for order ${order.id} (${effectiveType})`,
          status: 'success',
        });
        totalSellerRefund += sellerRefund;
      }
    }

    buyerWallet.balance = toMoney((Number(buyerWallet.balance || 0) + amount));
    await buyerWallet.save();
    await WalletTransaction.create({
      walletId: buyerWallet.id,
      userId: req.user.id,
      type: 'refund',
      amount,
      relatedOrderId: order.id,
      note: `Refund received for order ${order.id} (${effectiveType})`,
      status: 'success',
    });

    await License.update({ status: 'revoked' }, { where: { userId: req.user.id, orderId: order.id } });

    order.status = 'cancelled';
    order.escrowReleased = true;
    order.releasedAt = new Date();
    await order.save();

    res.json({ success: true, message: 'Refund processed', data: { refundedAmount: amount, escrowStatus: 'REFUNDED', effectiveType, sellerRefundTotal: totalSellerRefund } });
  } catch (err) { next(err); }
};

exports.adminHandleRefund = async (req, res, next) => {
  try {
    const { orderId, refundAmount, requestedAt, reason } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required' });

    const order = await Order.findByPk(orderId, { include: [{ model: OrderItem, include: [Product] }] });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Already refunded' });
    }

    const refundReq = {
      orderId,
      refundAmount: refundAmount ?? order.totalAmount,
      requestedAt: requestedAt || Date.now(),
      returnType: 'auto_admin',
      reason: reason || 'Admin auto-handled refund',
    };

    const result = await exports.processReturn({
      user: { id: order.userId },
      body: { ...refundReq, returnType: (new Date(refundReq.requestedAt).getTime() - new Date(order.createdAt).getTime()) < SEVEN_DAYS_MS ? 'before_7_days' : 'after_7_days' }
    }, { status: () => ({ json: (payload) => payload }), json: (payload) => payload }, next);

    if (result && result.success === false) {
      return res.status(400).json(result);
    }

    await createNotification(order.userId, 'refund_admin_processed', { orderId, reason: refundReq.reason }, 'email');
    res.json({ success: true, message: 'Refund auto-handled by admin', data: result && result.data ? result.data : { orderId } });
  } catch (err) { next(err); }
};

exports.adminListWallets = async (req, res, next) => {
  try {
    const wallets = await Wallet.findAll({
      include: [{ model: User, attributes: ['id', 'fullName', 'email', 'status'] }],
      order: [['lastUpdated', 'DESC']],
    });
    res.json({ success: true, data: wallets });
  } catch (err) { next(err); }
};

exports.adminSuspendSeller = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const wallet = await ensureWallet(userId);

    wallet.contractStatus = 'suspended';
    user.status = 'locked';
    await user.save();
    await wallet.save();

    await createNotification(userId, 'seller_suspended', { reason: 'Admin suspended seller due to deposit policy' }, 'email');
    res.json({ success: true, message: 'Seller suspended', data: { user, wallet } });
  } catch (err) { next(err); }
};

exports.calculateEscrowReleasePlan = calculateEscrowReleasePlan;

exports.adminResumeSeller = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const wallet = await ensureWallet(userId);

    if (wallet.depositBalance >= wallet.minimumDeposit) {
      wallet.contractStatus = 'registered';
      user.status = 'active';
    } else {
      wallet.contractStatus = 'suspended';
    }

    await wallet.save();
    await user.save();

    await createNotification(userId, 'seller_resumed', { reason: 'Admin restored seller contract after deposit correction' }, 'email');
    res.json({ success: true, message: 'Seller contract status updated', data: { user, wallet } });
  } catch (err) { next(err); }
};
