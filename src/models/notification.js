const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    userId: { type: DataTypes.UUID, allowNull: true },
    type: { type: DataTypes.STRING },
    channel: { type: DataTypes.ENUM('email','push','in-app'), defaultValue: 'in-app' },
    payload: { type: DataTypes.JSON },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
  });

  return Notification;
};
