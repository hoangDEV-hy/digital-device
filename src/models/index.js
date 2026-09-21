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
};
