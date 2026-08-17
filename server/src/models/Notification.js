const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Notification extends Model {}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(
        'LOW_STOCK',
        'CRITICAL_STOCK',
        'OUT_OF_STOCK',
        'PREDICTED_SHORTAGE',
        'REORDER_REQUIRED',
        'RESTOCK_DUE'
      ),
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    channel: {
      type: DataTypes.ENUM('EMAIL', 'SMS', 'IN_APP', 'PUSH'),
      defaultValue: 'IN_APP',
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    updatedAt: false,
  }
);

module.exports = Notification;
