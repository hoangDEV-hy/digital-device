const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    reporterId: { type: DataTypes.UUID, allowNull: false },
    reportedUserId: { type: DataTypes.UUID, allowNull: false },
    reason: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('open','reviewed','dismissed'), defaultValue: 'open' },
  });

  return Report;
};
