const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => sequelize.define('ChatParticipant', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
  conversationId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
  lastReadAt: { type: DataTypes.DATE, allowNull: true },
}, {
  indexes: [{ unique: true, fields: ['conversationId', 'userId'] }],
});