const { Op } = require('sequelize');
const {
  ChatConversation,
  ChatParticipant,
  ChatMessage,
  Product,
  Order,
  OrderItem,
  User,
} = require('../models');

const userFields = ['id', 'fullName', 'avatar', 'role'];
const roomName = (conversationId) => `chat:${conversationId}`;

async function isParticipant(conversationId, userId) {
  return ChatParticipant.findOne({ where: { conversationId, userId } });
}

async function canStartCustomerConversation(userId, peerId, productId) {
  if (!productId) return null;
  const product = await Product.findByPk(productId);
  if (!product || product.visibility !== 'active' || product.reviewStatus !== 'approved') return null;

  if (product.sellerId === peerId && product.sellerId !== userId) {
    return { productId: product.id, orderId: null };
  }

  if (product.sellerId === userId && product.sellerId !== peerId) {
    const item = await OrderItem.findOne({
      where: { productId },
      include: [{ model: Order, where: { userId: peerId, status: 'paid' }, required: true }],
    });
    if (item) return { productId: product.id, orderId: item.Order.id };
  }

  return null;
}

exports.listContacts = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const contacts = new Map();

    if (req.user.role === 'admin') {
      const users = await User.findAll({
        where: { id: { [Op.ne]: currentUserId }, status: 'active' },
        attributes: userFields,
        order: [['fullName', 'ASC']],
        limit: 200,
      });
      return res.json({ success: true, data: users.map((user) => ({ user, productId: null })) });
    }

    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: userFields,
      order: [['fullName', 'ASC']],
    });
    for (const admin of admins) {
      contacts.set(admin.id, { user: admin, productId: null });
    }

    const sellerProducts = await Product.findAll({
      where: {
        sellerId: { [Op.ne]: currentUserId },
        visibility: 'active',
        reviewStatus: 'approved',
      },
      include: [{ model: User, as: 'seller', attributes: userFields, where: { status: 'active' } }],
      order: [['createdAt', 'DESC']],
      limit: 300,
    });
    for (const product of sellerProducts) {
      if (!contacts.has(product.sellerId)) {
        contacts.set(product.sellerId, { user: product.seller, productId: product.id });
      }
    }

    const purchasedItems = await OrderItem.findAll({
      include: [
        { model: Product, where: { sellerId: currentUserId }, required: true },
        {
          model: Order,
          where: { status: 'paid' },
          required: true,
          include: [{ model: User, attributes: userFields, where: { status: 'active' } }],
        },
      ],
      limit: 300,
    });
    for (const item of purchasedItems) {
      const buyer = item.Order.User;
      if (buyer.id !== currentUserId && !contacts.has(buyer.id)) {
        contacts.set(buyer.id, { user: buyer, productId: item.productId });
      }
    }

    return res.json({ success: true, data: [...contacts.values()] });
  } catch (err) {
    next(err);
  }
};

exports.listConversations = async (req, res, next) => {
  try {
    let ids;
    if (req.user.role !== 'admin') {
      const memberships = await ChatParticipant.findAll({
        where: { userId: req.user.id },
        attributes: ['conversationId'],
      });
      ids = memberships.map((membership) => membership.conversationId);
    }

    const conversations = await ChatConversation.findAll({
      where: ids ? { id: { [Op.in]: ids } } : undefined,
      include: [
        {
          model: ChatParticipant,
          as: 'participants',
          include: [{ model: User, as: 'user', attributes: userFields }],
        },
        { model: Product, as: 'product', attributes: ['id', 'title'] },
        { model: ChatMessage, as: 'messages', separate: true, limit: 1, order: [['createdAt', 'DESC']], include: [{ model: User, as: 'sender', attributes: userFields }] },
      ],
      order: [['lastMessageAt', 'DESC']],
      limit: 100,
    });
    return res.json({ success: true, data: conversations });
  } catch (err) {
    next(err);
  }
};

exports.startConversation = async (req, res, next) => {
  try {
    const { participantId, productId } = req.body;
    if (!participantId || participantId === req.user.id) {
      return res.status(400).json({ success: false, message: 'participantId is required and must be another user' });
    }

    const peer = await User.findByPk(participantId);
    if (!peer || (peer.status !== 'active' && peer.role !== 'admin')) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let context = { productId: productId || null, orderId: null };
    if (req.user.role !== 'admin' && peer.role !== 'admin') {
      context = await canStartCustomerConversation(req.user.id, participantId, productId);
      if (!context) return res.status(403).json({ success: false, message: 'Chat is available only for a product seller or a buyer with a paid order' });
    } else if (peer.role === 'admin') {
      context = { productId: null, orderId: null };
    }

    const memberships = await ChatParticipant.findAll({
      where: { userId: { [Op.in]: [req.user.id, participantId] } },
      attributes: ['conversationId', 'userId'],
    });
    const userIdsByConversation = new Map();
    for (const membership of memberships) {
      const userIds = userIdsByConversation.get(membership.conversationId) || new Set();
      userIds.add(membership.userId);
      userIdsByConversation.set(membership.conversationId, userIds);
    }
    const sharedId = [...userIdsByConversation].find(([, userIds]) => userIds.size === 2)?.[0];
    if (sharedId) {
      const existing = await ChatConversation.findByPk(sharedId, {
        include: [{ model: ChatParticipant, as: 'participants', include: [{ model: User, as: 'user', attributes: userFields }] }],
      });
      if (existing) return res.json({ success: true, data: existing });
    }

    const conversation = await ChatConversation.create(context);
    await ChatParticipant.bulkCreate([
      { conversationId: conversation.id, userId: req.user.id },
      { conversationId: conversation.id, userId: participantId },
    ]);
    const result = await ChatConversation.findByPk(conversation.id, {
      include: [{ model: ChatParticipant, as: 'participants', include: [{ model: User, as: 'user', attributes: userFields }] }],
    });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.listMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    if (req.user.role !== 'admin' && !(await isParticipant(conversationId, req.user.id))) {
      return res.status(403).json({ success: false, message: 'You are not a participant in this conversation' });
    }

    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
    const where = { conversationId };
    if (req.query.before) where.createdAt = { [Op.lt]: new Date(req.query.before) };
    const messages = await ChatMessage.findAll({
      where,
      include: [{ model: User, as: 'sender', attributes: userFields }],
      order: [['createdAt', 'DESC']],
      limit,
    });
    return res.json({ success: true, data: messages.reverse() });
  } catch (err) {
    next(err);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!content || content.length > 4000) {
      return res.status(400).json({ success: false, message: 'Message must contain 1 to 4000 characters' });
    }
    const conversation = await ChatConversation.findByPk(conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    let participant = await isParticipant(conversationId, req.user.id);
    if (!participant && req.user.role === 'admin') {
      participant = await ChatParticipant.create({ conversationId, userId: req.user.id });
    }
    if (!participant) return res.status(403).json({ success: false, message: 'You are not a participant in this conversation' });

    const message = await ChatMessage.create({ conversationId, senderId: req.user.id, content });
    await conversation.update({ lastMessageAt: message.createdAt });
    await participant.update({ lastReadAt: message.createdAt });
    const result = await ChatMessage.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: userFields }],
    });
    req.app.get('io')?.to(roomName(conversationId)).emit('chat:message', result);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    let participant = await isParticipant(conversationId, req.user.id);
    if (!participant && req.user.role === 'admin' && await ChatConversation.findByPk(conversationId)) {
      participant = await ChatParticipant.create({ conversationId, userId: req.user.id });
    }
    if (!participant) return res.status(403).json({ success: false, message: 'You are not a participant in this conversation' });
    const lastReadAt = new Date();
    await participant.update({ lastReadAt });
    req.app.get('io')?.to(roomName(conversationId)).emit('chat:read', { conversationId, userId: req.user.id, lastReadAt });
    return res.json({ success: true, data: { lastReadAt } });
  } catch (err) {
    next(err);
  }
};