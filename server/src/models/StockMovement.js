const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class StockMovement extends Model {}

StockMovement.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        'STOCK_IN',
        'STOCK_OUT',
        'SALE',
        'RETURN',
        'DAMAGED',
        'ADJUSTMENT',
        'RESTOCK'
      ),
      allowNull: false,
    },
    // Positive for inbound movements, negative for outbound.
    quantity_change: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stock_after: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    note: DataTypes.STRING,
    performed_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'StockMovement',
    tableName: 'stock_movements',
    updatedAt: false,
  }
);

module.exports = StockMovement;
