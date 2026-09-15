const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    orderId: { type: DataTypes.UUID, allowNull: false },
    method: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM('pending','success','failed'), defaultValue: 'pending' },
    providerTxId: { type: DataTypes.STRING },
    paidAt: { type: DataTypes.DATE },
  });

  return Payment;
};
