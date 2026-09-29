const { Wallet, WalletTransaction, User, Order, OrderItem, Product, Notification } = require('../models');
const { Op } = require('sequelize');

const DEFAULT_MIN_DEPOSIT = 100000;
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

    wallet.balance -= depositAmount;
    wallet.depositBalance += depositAmount;
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
    wallet.balance += refundAmount;
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

exports.withdrawFunds = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const amountNum = toMoney(amount);
    if (!amountNum || amountNum <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

    const wallet = await ensureWallet(req.user.id);
    const available = toMoney(wallet.balance || 0);
    if (amountNum > available) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    wallet.balance -= amountNum;
    await wallet.save();

    await WalletTransaction.create({
      walletId: wallet.id,
      userId: req.user.id,
      type: 'withdrawal',
      amount: amountNum,
      note: 'Wallet withdrawal',
      status: 'success',
    });

    await createNotification(req.user.id, 'withdrawal_success', { amount: amountNum }, 'email');
    res.json({ success: true, message: 'Withdrawal successful', data: wallet });
  } catch (err) { next(err); }
};

exports.updateWalletBalance = async (req, res, next) => {
  try {
    const { amount, type, note, userId } = req.body;
    const targetUserId = req.user?.id || userId;
    if (!targetUserId) return res.status(400).json({ success: false, message: 'User id is required' });

    const wallet = await ensureWallet(targetUserId);
    const amountVal = toMoney(amount || 0);

    if (type === 'deposit') {
      wallet.balance += amountVal;
    } else if (type === 'escrow_hold') {
      wallet.escrowBalance += amountVal;
      wallet.balance -= amountVal;
    } else if (type === 'escrow_release') {
      wallet.escrowBalance -= amountVal;
      wallet.balance += amountVal;
    } else if (type === 'penalty') {
      wallet.balance -= amountVal;
      wallet.depositBalance -= amountVal;
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
    wallet.escrowBalance += amount;
    wallet.balance -= amount;
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
      for (const sellerId of sellerIds) {
        const wallet = await ensureWallet(sellerId);
        const releaseAmount = Math.min(toMoney(itemTotals[sellerId] || 0), toMoney(wallet.escrowBalance || 0));

        if (releaseAmount <= 0) {
          results.push({ sellerId, released: 0, escrowBalance: wallet.escrowBalance || 0, skipped: true });
          continue;
        }

        wallet.escrowBalance = toMoney((wallet.escrowBalance || 0) - releaseAmount);
        wallet.balance = toMoney((wallet.balance || 0) + releaseAmount);
        await wallet.save();

        await WalletTransaction.create({
          walletId: wallet.id,
          userId: sellerId,
          type: 'escrow_release',
          amount: releaseAmount,
          relatedOrderId: order.id,
          note: `Escrow released after 7 days for order ${order.id}`,
          status: 'success',
        });

        await createNotification(sellerId, 'escrow_released', { orderId: order.id, amount: releaseAmount }, 'email');
        results.push({ sellerId, released: releaseAmount, escrowBalance: wallet.escrowBalance, skipped: false });
      }

      order.escrowReleased = true;
      order.releasedAt = new Date();
      await order.save();

      return res.json({ success: true, message: 'Escrow released per seller', data: { orderId: order.id, releases: results } });
    }

    return orderController.releaseEscrowForEligibleOrders(req, res, next);
  } catch (err) { next(err); }
};

exports.processReturn = async (req, res, next) => {
  try {
    const { orderId, refundAmount, returnType, requestedAt } = req.body;
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const seller = await User.findByPk(order.userId);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    const wallet = await ensureWallet(seller.id);
    const refundRequestTime = new Date(requestedAt || Date.now());
    const orderCreatedAt = new Date(order.createdAt || order.createdAt);
    const beforeSevenDays = (refundRequestTime.getTime() - orderCreatedAt.getTime()) < SEVEN_DAYS_MS;
    const effectiveType = returnType || (beforeSevenDays ? 'before_7_days' : 'after_7_days');
    const amount = toMoney(refundAmount ?? order.totalAmount ?? 0);

    if (effectiveType === 'before_7_days') {
      wallet.escrowBalance -= amount;
      wallet.balance -= amount;
      wallet.depositBalance -= amount;
    } else if (effectiveType === 'after_7_days') {
      wallet.depositBalance -= amount;
      wallet.balance -= amount;
      wallet.escrowBalance = Math.max(0, toMoney(wallet.escrowBalance || 0));
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported return type' });
    }

    order.status = 'cancelled';
    await order.save();

    await wallet.save();
    const suspended = await applySellerContractRules(seller, wallet, `refund ${effectiveType} for order ${order.id}`);
    await WalletTransaction.create({
      walletId: wallet.id,
      userId: seller.id,
      type: 'refund',
      amount,
      relatedOrderId: order.id,
      note: `Refund processed for order ${order.id} (${effectiveType})`,
      status: 'success',
    });

    await createNotification(seller.id, 'refund_processed', { orderId: order.id, amount, suspended }, 'email');
    res.json({ success: true, data: { wallet, suspended, effectiveType } });
  } catch (err) { next(err); }
};

exports.adminHandleRefund = async (req, res, next) => {
  try {
    const { orderId, refundAmount, requestedAt, reason } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required' });

    const wallet = await ensureWallet(req.user.id);
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const refundReq = {
      orderId,
      refundAmount,
      requestedAt: requestedAt || Date.now(),
      returnType: 'auto_admin',
      reason: reason || 'Admin auto-handled refund',
    };

    const seller = await User.findByPk(order.userId);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    const result = await exports.processReturn({
      body: { ...refundReq, returnType: (new Date(refundReq.requestedAt).getTime() - new Date(order.createdAt).getTime()) < SEVEN_DAYS_MS ? 'before_7_days' : 'after_7_days' }
    }, { status: () => ({ json: (payload) => payload }) }, next);

    if (result && result.success === false) {
      return res.status(400).json(result);
    }

    await createNotification(seller.id, 'refund_admin_processed', { orderId, reason: refundReq.reason }, 'email');
    res.json({ success: true, message: 'Refund auto-handled by admin', data: result && result.data ? result.data : wallet });
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
