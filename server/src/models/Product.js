const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Product extends Model {
  /**
   * Derives a status label from current stock vs thresholds.
   * IN_STOCK   -> above minimum
   * LOW_STOCK  -> at or below minimum, above critical (25% of min)
   * CRITICAL   -> at or below critical threshold, above 0
   * OUT_OF_STOCK -> zero
   */
  getStockStatus() {
    const stock = this.current_stock;
    const min = this.minimum_stock;
    const criticalThreshold = Math.ceil(min * 0.25);

    if (stock <= 0) return 'OUT_OF_STOCK';
    if (stock <= criticalThreshold) return 'CRITICAL';
    if (stock <= min) return 'LOW_STOCK';
    return 'IN_STOCK';
  }
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    category: DataTypes.STRING,
    cost_price: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    selling_price: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    current_stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0 },
    },
    minimum_stock: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    maximum_stock: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
    },
    reorder_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
    },
    safety_stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    supplier_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
  }
);

module.exports = Product;
