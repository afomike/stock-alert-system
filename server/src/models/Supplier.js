const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Supplier extends Model {}

Supplier.init(
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
    contact_person: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      validate: { isEmail: true },
    },
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
    // Average number of days between order placement and delivery.
    // Used directly in reorder point + shortage prediction calculations.
    average_lead_time_days: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },
  },
  {
    sequelize,
    modelName: 'Supplier',
    tableName: 'suppliers',
  }
);

module.exports = Supplier;
