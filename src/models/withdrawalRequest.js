const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => sequelize.define('WithdrawalRequest', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
  userId: { type: DataTypes.UUID, allowNull: false },
  walletId: { type: DataTypes.UUID, allowNull: false },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  bankName: { type: DataTypes.STRING(120), allowNull: false },
  bankAccount: { type: DataTypes.STRING(80), allowNull: false },
  accountHolder: { type: DataTypes.STRING(120), allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
  reviewedBy: { type: DataTypes.UUID, allowNull: true },
  reviewedAt: { type: DataTypes.DATE, allowNull: true },
  adminNote: { type: DataTypes.TEXT, allowNull: true },
});