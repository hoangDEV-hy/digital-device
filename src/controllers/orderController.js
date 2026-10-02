const { Order, OrderItem, Product, User, Payment, Cart, CartItem, Wallet, WalletTransaction, Notification } = require('../models');
const { Op } = require('sequelize');
const { addMoney } = require('../utils/money');
const { calculateLineSettlement } = require('../utils/commission');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
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
      minimumDeposit: 50000000,
    });
  }
  return wallet;
};

const getSellerBreakdown = (orderItems = [], commissionApplied = true) => {
  const totals = {};
  for (const item of orderItems) {
    const product = item.Product || item.product || null;
    const sellerId = product?.sellerId || item.sellerId;
    if (!sellerId) continue;
    const settlement = calculateLineSettlement(item.price, Number(item.quantity || 1));
    const sellerAmount = commissionApplied ? settlement.sellerNet : settlement.gross;
    totals[sellerId] = toMoney((totals[sellerId] || 0) + sellerAmount);
  }
  return totals;
};

exports.releaseEscrowForEligibleOrders = async (req, res, next) => {
  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - SEVEN_DAYS_MS);

    const orders = await Order.findAll({
      where: {
        status: 'paid',
        escrowReleased: false,
        createdAt: { [Op.lte]: cutoff },
      },
      include: [{
        model: OrderItem,
        include: [{ model: Product, attributes: ['id', 'sellerId', 'title'] }],
      }],
      order: [['createdAt', 'ASC']],
    });

    if (!orders.length) {
      return res.json({ success: true, message: 'No eligible orders for escrow release', data: { releasedCount: 0, totalReleased: 0, orders: [] } });
    }

    let totalReleased = 0;
    const releasedOrders = [];

    for (const order of orders) {
      const commissionTransaction = await WalletTransaction.findOne({
        where: { relatedOrderId: order.id, type: 'commission', status: 'success' },
        attributes: ['id'],
      });
      const sellerTotals = getSellerBreakdown(order.OrderItems || [], Boolean(commissionTransaction));
      const perSeller = [];

      for (const [sellerId, orderAmount] of Object.entries(sellerTotals)) {
        const wallet = await ensureWallet(sellerId);
        const releaseAmount = Math.min(toMoney(orderAmount), toMoney(wallet.escrowBalance || 0));

        if (releaseAmount <= 0) {
          perSeller.push({ sellerId, releaseAmount: 0, escrowBalance: toMoney(wallet.escrowBalance || 0), note: 'No escrow available' });
          continue;
        }

        wallet.escrowBalance = toMoney((wallet.escrowBalance || 0) - releaseAmount);
        wallet.balance = addMoney(wallet.balance, releaseAmount);
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

        await Notification.create({
          userId: sellerId,
          type: 'escrow_released',
          channel: 'email',
          payload: { orderId: order.id, amount: releaseAmount },
        });

        totalReleased += releaseAmount;
        perSeller.push({ sellerId, releaseAmount, escrowBalance: wallet.escrowBalance });
      }

      order.escrowReleased = true;
      order.releasedAt = new Date();
      await order.save();

      releasedOrders.push({
        orderId: order.id,
        userId: order.userId,
        releasedAt: order.releasedAt,
        perSeller,
      });
    }

    return res.json({
      success: true,
      message: 'Escrow released for eligible orders',
      data: {
        releasedCount: releasedOrders.length,
        totalReleased,
        orders: releasedOrders,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getSellerBreakdown = getSellerBreakdown;

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
        { model: Payment },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: [
        { model: User, attributes: ['id', 'fullName', 'email'] },
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['id', 'title', 'price', 'thumbnail', 'type', 'sellerId'] }],
        },
        { model: Payment },
      ],
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};
