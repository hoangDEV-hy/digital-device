const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define('Cart', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    userId: { type: DataTypes.UUID, allowNull: false },
    status: { type: DataTypes.ENUM('active','ordered'), defaultValue: 'active' },
  });

  return Cart;
};
