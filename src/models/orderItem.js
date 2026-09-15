const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    orderId: { type: DataTypes.UUID, allowNull: false },
    productId: { type: DataTypes.UUID, allowNull: false },
    price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  });

  return OrderItem;
};
