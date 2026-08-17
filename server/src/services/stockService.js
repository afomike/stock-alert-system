const { Op, fn, col, literal } = require('sequelize');
const { Product, StockMovement, Notification, Supplier } = require('../models');
const { deliverAlert } = require('./deliveryService');

/**
 * Reorder Point = (Average Daily Demand x Supplier Lead Time) + Safety Stock
 */
function calculateReorderPoint(avgDailyDemand, leadTimeDays, safetyStock = 0) {
  return Math.ceil(avgDailyDemand * leadTimeDays + safetyStock);
}

/**
 * Estimates average daily demand for a product from SALE / STOCK_OUT
 * movements over a trailing window (default 30 days).
 */
async function getAverageDailyDemand(productId, windowDays = 30) {
  const since = new Date();
  since.setDate(since.getDate() - windowDays);

  const result = await StockMovement.findOne({
    attributes: [[fn('SUM', literal('ABS(quantity_change)')), 'total_out']],
    where: {
      product_id: productId,
      type: { [Op.in]: ['SALE', 'STOCK_OUT'] },
      created_at: { [Op.gte]: since },
    },
    raw: true,
  });

  const totalOut = Number(result?.total_out || 0);
  return totalOut / windowDays;
}

/**
 * Predicts stockout timing and risk level for a single product.
 * Mirrors the spec's example:
 *   Estimated Days Until Stockout = currentStock / avgDailyDemand
 *   Risk is HIGH if that is <= supplier lead time.
 */
async function predictShortage(product) {
  const avgDailyDemand = await getAverageDailyDemand(product.id);
  const leadTime = product.supplier?.average_lead_time_days ?? 5;

  if (avgDailyDemand <= 0) {
    return {
      productId: product.id,
      productName: product.name,
      averageDailyDemand: 0,
      estimatedDaysUntilStockout: null,
      predictedStockoutDate: null,
      riskLevel: 'LOW',
      reorderPoint: calculateReorderPoint(0, leadTime, product.safety_stock),
    };
  }

  const daysUntilStockout = product.current_stock / avgDailyDemand;
  const stockoutDate = new Date();
  stockoutDate.setDate(stockoutDate.getDate() + Math.floor(daysUntilStockout));

  let riskLevel = 'LOW';
  if (daysUntilStockout <= leadTime) riskLevel = 'HIGH';
  else if (daysUntilStockout <= leadTime * 1.5) riskLevel = 'MEDIUM';

  return {
    productId: product.id,
    productName: product.name,
    averageDailyDemand: Number(avgDailyDemand.toFixed(2)),
    estimatedDaysUntilStockout: Number(daysUntilStockout.toFixed(1)),
    predictedStockoutDate: stockoutDate.toISOString().split('T')[0],
    riskLevel,
    reorderPoint: calculateReorderPoint(avgDailyDemand, leadTime, product.safety_stock),
  };
}

/**
 * Runs shortage prediction across all active products.
 */
async function predictAllShortages() {
  const products = await Product.findAll({ include: [{ model: Supplier, as: 'supplier' }] });
  const predictions = await Promise.all(products.map(predictShortage));
  return predictions.sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return order[a.riskLevel] - order[b.riskLevel];
  });
}

/**
 * Returns products whose current stock is at/below minimum_stock,
 * annotated with the computed status label.
 */
async function getLowStockProducts() {
  const products = await Product.findAll({
    where: { current_stock: { [Op.lte]: col('minimum_stock') } },
    include: [{ model: Supplier, as: 'supplier' }],
    order: [['current_stock', 'ASC']],
  });

  return products.map((p) => ({
    ...p.toJSON(),
    status: p.getStockStatus(),
  }));
}

/**
 * Builds a reorder report for a single product.
 */
async function buildReorderReport(product) {
  const avgDailyDemand = await getAverageDailyDemand(product.id);
  const recommendedOrder = Math.max(
    product.reorder_quantity,
    Math.ceil(avgDailyDemand * (product.supplier?.average_lead_time_days ?? 5) * 1.2)
  );

  const priority =
    product.current_stock <= 0
      ? 'CRITICAL'
      : product.current_stock <= product.minimum_stock * 0.25
      ? 'HIGH'
      : 'NORMAL';

  return {
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    currentStock: product.current_stock,
    minimumStock: product.minimum_stock,
    averageDailyDemand: Number(avgDailyDemand.toFixed(2)),
    recommendedOrderQuantity: recommendedOrder,
    supplier: product.supplier ? product.supplier.name : null,
    priority,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generates reorder reports for every product currently at/below minimum stock.
 */
async function generateReorderReports() {
  const lowStockProducts = await Product.findAll({
    where: { current_stock: { [Op.lte]: col('minimum_stock') } },
    include: [{ model: Supplier, as: 'supplier' }],
  });

  return Promise.all(lowStockProducts.map(buildReorderReport));
}

/**
 * Records a stock movement, updates the product's current_stock,
 * and creates a notification if the product crosses into a low state.
 * `quantityChange` should be positive for inbound, negative for outbound.
 */
async function recordStockMovement({ productId, type, quantityChange, note, userId }) {
  const product = await Product.findByPk(productId);
  if (!product) {
    const err = new Error('Product not found');
    err.status = 404;
    throw err;
  }

  const newStock = product.current_stock + quantityChange;
  if (newStock < 0) {
    const err = new Error('Stock cannot go below zero');
    err.status = 400;
    throw err;
  }

  product.current_stock = newStock;
  await product.save();

  const movement = await StockMovement.create({
    product_id: productId,
    type,
    quantity_change: quantityChange,
    stock_after: newStock,
    note,
    performed_by: userId || null,
  });

  await maybeCreateLowStockNotification(product);

  return { product, movement };
}

/**
 * Creates a Notification record if the product's status warrants one.
 * Kept idempotent-ish by only firing on status transitions callers can check,
 * but for simplicity here it just logs the current state each time it's called.
 */
async function maybeCreateLowStockNotification(product) {
  const status = product.getStockStatus();
  const statusToType = {
    OUT_OF_STOCK: 'OUT_OF_STOCK',
    CRITICAL: 'CRITICAL_STOCK',
    LOW_STOCK: 'LOW_STOCK',
  };

  const type = statusToType[status];
  if (!type) return null;

  const message = `${type.replace('_', ' ')}: ${product.name} has ${product.current_stock} units remaining. Recommended reorder quantity: ${product.reorder_quantity} units.`;

  const notification = await Notification.create({
    product_id: product.id,
    type,
    message,
    channel: 'IN_APP',
  });
  void deliverAlert({ type, message });
  return notification;
}

module.exports = {
  calculateReorderPoint,
  getAverageDailyDemand,
  predictShortage,
  predictAllShortages,
  getLowStockProducts,
  buildReorderReport,
  generateReorderReports,
  recordStockMovement,
  maybeCreateLowStockNotification,
};
