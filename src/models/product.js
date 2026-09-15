const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    price: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0.0 },
    type: { type: DataTypes.STRING },
    fileUrl: { type: DataTypes.STRING },
    thumbnail: { type: DataTypes.STRING },
    reviewStatus: { type: DataTypes.ENUM('pending','approved','rejected'), defaultValue: 'pending' },
    visibility: { type: DataTypes.ENUM('active','inactive'), defaultValue: 'inactive' },
  });

  return Product;
};
