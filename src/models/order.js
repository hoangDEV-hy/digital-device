const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    userId: { type: DataTypes.UUID, allowNull: false },
    totalAmount: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0.0 },
    status: { type: DataTypes.ENUM('pending','paid','failed','cancelled'), defaultValue: 'pending' },
  });

  return Order;
};
