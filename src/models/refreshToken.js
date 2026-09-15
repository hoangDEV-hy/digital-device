const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define('RefreshToken', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    token: { type: DataTypes.STRING, allowNull: false },
    expiresAt: { type: DataTypes.DATE },
  });

  return RefreshToken;
};
