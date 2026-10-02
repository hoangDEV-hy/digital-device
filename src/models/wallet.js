const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define('Wallet', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true },
    balance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    escrowBalance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    depositBalance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    contractStatus: { type: DataTypes.ENUM('inactive', 'registered', 'suspended'), defaultValue: 'inactive' },
    minimumDeposit: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 50000000.0 },
    lastUpdated: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    hooks: {
      beforeSave: (wallet) => {
        wallet.lastUpdated = new Date();
      },
    },
  });

  return Wallet;
};
