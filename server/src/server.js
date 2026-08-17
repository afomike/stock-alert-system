require('dotenv').config();
const cron = require('node-cron');
const app = require('./app');
const { sequelize } = require('./models');
const stockService = require('./services/stockService');
const { Product } = require('./models');

const PORT = process.env.PORT || 5000;

async function runLowStockSweep() {
  try {
    const products = await Product.findAll();
    for (const product of products) {
      await stockService.maybeCreateLowStockNotification(product);
    }
    console.log(`[cron] Low-stock sweep complete — checked ${products.length} products`);
  } catch (err) {
    console.error('[cron] Low-stock sweep failed:', err.message);
  }
}

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');

    // In production, use proper migrations (see src/utils/migrate.js) instead of sync.
    await sequelize.sync();
    console.log('Models synced');

    // Runs every day at 07:00 — sweeps all products and files low-stock notifications.
    cron.schedule('0 7 * * *', runLowStockSweep);

    app.listen(PORT, () => {
      console.log(`Stock Alert API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
