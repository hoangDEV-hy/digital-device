const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const License = sequelize.define('License', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    userId: { type: DataTypes.UUID, allowNull: false },
    productId: { type: DataTypes.UUID, allowNull: false },
    orderId: { type: DataTypes.UUID, allowNull: false },
    issuedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM('active','revoked'), defaultValue: 'active' },
  });

  return License;
};
