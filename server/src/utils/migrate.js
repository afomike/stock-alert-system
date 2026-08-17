/**
 * Simple schema sync for development.
 * For production, replace with proper Sequelize migrations (sequelize-cli)
 * so schema changes are versioned and reversible.
 */
require('dotenv').config();
const { sequelize } = require('../models');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    await sequelize.sync({ alter: true });
    console.log('Schema synced successfully');

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
