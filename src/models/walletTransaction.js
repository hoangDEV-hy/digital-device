const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const WalletTransaction = sequelize.define('WalletTransaction', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    walletId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.ENUM('deposit', 'withdrawal', 'escrow_hold', 'escrow_release', 'contract_register', 'contract_cancel', 'refund', 'penalty'), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    currency: { type: DataTypes.STRING, defaultValue: 'VND' },
    status: { type: DataTypes.ENUM('pending', 'success', 'failed'), defaultValue: 'success' },
    note: { type: DataTypes.TEXT },
    relatedOrderId: { type: DataTypes.UUID },
    relatedWithdrawalRequestId: { type: DataTypes.UUID },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });

  return WalletTransaction;
};
