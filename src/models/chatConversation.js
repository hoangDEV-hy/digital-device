const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => sequelize.define('ChatConversation', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
  productId: { type: DataTypes.UUID, allowNull: true },
  orderId: { type: DataTypes.UUID, allowNull: true },
  lastMessageAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});