const sequelize = require('../config/db');
const User = require('./User');
const Supplier = require('./Supplier');
const Product = require('./Product');
const StockMovement = require('./StockMovement');
const Notification = require('./Notification');

// Supplier <-> Product
// onDelete: SET NULL — deleting a supplier shouldn't be blocked by, or cascade
// into deleting, the products it supplies; they just lose their supplier link.
Supplier.hasMany(Product, { foreignKey: 'supplier_id', as: 'products', onDelete: 'SET NULL' });
Product.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

// Product <-> StockMovement
Product.hasMany(StockMovement, { foreignKey: 'product_id', as: 'movements' });
StockMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// User <-> StockMovement (who performed it)
User.hasMany(StockMovement, { foreignKey: 'performed_by', as: 'movements' });
StockMovement.belongsTo(User, { foreignKey: 'performed_by', as: 'user' });

// Product <-> Notification
Product.hasMany(Notification, { foreignKey: 'product_id', as: 'notifications' });
Notification.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = {
  sequelize,
  User,
  Supplier,
  Product,
  StockMovement,
  Notification,
};
