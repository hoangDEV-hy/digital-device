const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => sequelize.define('ChatMessage', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
  conversationId: { type: DataTypes.UUID, allowNull: false },
  senderId: { type: DataTypes.UUID, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
});