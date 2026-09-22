const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    userId: { type: DataTypes.UUID, allowNull: false },
    productId: { type: DataTypes.UUID, allowNull: false },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    content: { type: DataTypes.TEXT, allowNull: false },
  });

  return Review;
};
