const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const User = require('./user')(sequelize, Sequelize.DataTypes);
const Category = require('./category')(sequelize, Sequelize.DataTypes);
const Product = require('./product')(sequelize, Sequelize.DataTypes);
const RefreshToken = require('./refreshToken')(sequelize, Sequelize.DataTypes);
const Order = require('./order')(sequelize, Sequelize.DataTypes);
const OrderItem = require('./orderItem')(sequelize, Sequelize.DataTypes);
const Payment = require('./payment')(sequelize, Sequelize.DataTypes);
const License = require('./license')(sequelize, Sequelize.DataTypes);
const Cart = require('./cart')(sequelize, Sequelize.DataTypes);
const CartItem = require('./cartItem')(sequelize, Sequelize.DataTypes);
const Report = require('./report')(sequelize, Sequelize.DataTypes);
const Notification = require('./notification')(sequelize, Sequelize.DataTypes);
const Review = require('./review')(sequelize, Sequelize.DataTypes);
const Wallet = require('./wallet')(sequelize, Sequelize.DataTypes);
const WalletTransaction = require('./walletTransaction')(sequelize, Sequelize.DataTypes);
const ChatConversation = require('./chatConversation')(sequelize, Sequelize.DataTypes);
const ChatParticipant = require('./chatParticipant')(sequelize, Sequelize.DataTypes);
const ChatMessage = require('./chatMessage')(sequelize, Sequelize.DataTypes);
const WithdrawalRequest = require('./withdrawalRequest')(sequelize, Sequelize.DataTypes);

User.hasMany(Product, { foreignKey: 'sellerId' });
Product.belongsTo(User, { as: 'seller', foreignKey: 'sellerId' });
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });
User.hasMany(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });
Order.hasOne(Payment, { foreignKey: 'orderId' });
Payment.belongsTo(Order, { foreignKey: 'orderId' });
User.hasMany(License, { foreignKey: 'userId' });
License.belongsTo(User, { foreignKey: 'userId' });
Product.hasMany(License, { foreignKey: 'productId' });
License.belongsTo(Product, { foreignKey: 'productId' });
Order.hasMany(License, { foreignKey: 'orderId' });
License.belongsTo(Order, { foreignKey: 'orderId' });
User.hasOne(Cart, { foreignKey: 'userId' });
Cart.belongsTo(User, { foreignKey: 'userId' });
Cart.hasMany(CartItem, { foreignKey: 'cartId' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });
CartItem.belongsTo(Product, { foreignKey: 'productId' });

// reports & notifications
User.hasMany(Report, { foreignKey: 'reporterId' });
Report.belongsTo(User, { as: 'reporter', foreignKey: 'reporterId' });
User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Product.hasMany(Review, { foreignKey: 'productId' });
Review.belongsTo(Product, { foreignKey: 'productId' });
User.hasOne(Wallet, { foreignKey: 'userId' });
Wallet.belongsTo(User, { foreignKey: 'userId' });
Wallet.hasMany(WalletTransaction, { foreignKey: 'walletId' });
WalletTransaction.belongsTo(Wallet, { foreignKey: 'walletId' });
Wallet.hasMany(WithdrawalRequest, { as: 'withdrawalRequests', foreignKey: 'walletId' });
WithdrawalRequest.belongsTo(Wallet, { as: 'wallet', foreignKey: 'walletId' });
User.hasMany(WithdrawalRequest, { as: 'withdrawalRequests', foreignKey: 'userId' });
WithdrawalRequest.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(WithdrawalRequest, { as: 'reviewedWithdrawals', foreignKey: 'reviewedBy' });
WithdrawalRequest.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewedBy' });
WithdrawalRequest.hasMany(WalletTransaction, { as: 'transactions', foreignKey: 'relatedWithdrawalRequestId' });
WalletTransaction.belongsTo(WithdrawalRequest, { as: 'withdrawalRequest', foreignKey: 'relatedWithdrawalRequestId' });
User.hasMany(ChatParticipant, { foreignKey: 'userId' });
ChatParticipant.belongsTo(User, { as: 'user', foreignKey: 'userId' });
ChatConversation.hasMany(ChatParticipant, { as: 'participants', foreignKey: 'conversationId', onDelete: 'CASCADE' });
ChatParticipant.belongsTo(ChatConversation, { foreignKey: 'conversationId' });
ChatConversation.hasMany(ChatMessage, { as: 'messages', foreignKey: 'conversationId', onDelete: 'CASCADE' });
ChatMessage.belongsTo(ChatConversation, { foreignKey: 'conversationId' });
User.hasMany(ChatMessage, { foreignKey: 'senderId' });
ChatMessage.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Product.hasMany(ChatConversation, { foreignKey: 'productId' });
ChatConversation.belongsTo(Product, { as: 'product', foreignKey: 'productId' });
Order.hasMany(ChatConversation, { foreignKey: 'orderId' });
ChatConversation.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Category,
  Product,
  RefreshToken,
  Order,
  OrderItem,
  Payment,
  License,
  Cart,
  CartItem,
  Report,
  Notification,
  Review,
  Wallet,
  WalletTransaction,
  ChatConversation,
  ChatParticipant,
  ChatMessage,
  WithdrawalRequest,
};
