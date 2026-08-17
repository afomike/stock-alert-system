require('dotenv').config();
const { sequelize, User, Supplier, Product, StockMovement } = require('../models');

async function seed() {
  try {
    await sequelize.sync({ force: true }); // WARNING: wipes existing data
    console.log('Tables recreated');

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@stockalert.com',
      password_hash: 'admin123', // hashed automatically
      role: 'admin',
    });

    const supplier = await Supplier.create({
      name: 'ABC Electronics',
      contact_person: 'John Doe',
      email: 'sales@abcelectronics.com',
      phone: '+234-800-000-0000',
      address: 'Lagos, Nigeria',
      average_lead_time_days: 4,
    });

    const mouse = await Product.create({
      name: 'Wireless Mouse',
      sku: 'WM-001',
      category: 'Electronics',
      cost_price: 3500,
      selling_price: 5500,
      current_stock: 8,
      minimum_stock: 20,
      maximum_stock: 200,
      reorder_quantity: 60,
      safety_stock: 10,
      supplier_id: supplier.id,
    });

    const water = await Product.create({
      name: 'Bottled Water (50cl)',
      sku: 'BW-050',
      category: 'Beverages',
      cost_price: 100,
      selling_price: 200,
      current_stock: 150,
      minimum_stock: 100,
      maximum_stock: 1000,
      reorder_quantity: 300,
      safety_stock: 50,
      supplier_id: supplier.id,
    });

    // Backfill 14 days of SALE movements so demand/forecast endpoints have data.
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    for (let i = 14; i >= 1; i--) {
      const createdAt = new Date(now - i * day);

      await StockMovement.create({
        product_id: mouse.id,
        type: 'SALE',
        quantity_change: -6,
        stock_after: mouse.current_stock, // simplified for seed data
        note: 'Seed sale',
        createdAt, // Sequelize attribute name (camelCase) — maps to the created_at column
      });

      await StockMovement.create({
        product_id: water.id,
        type: 'SALE',
        quantity_change: -35,
        stock_after: water.current_stock, // simplified for seed data
        note: 'Seed sale',
        createdAt,
      });
    }

    console.log('Seed data created:');
    console.log(`  Admin login -> email: ${admin.email}, password: admin123`);
    console.log(`  Products: ${mouse.name} (SKU ${mouse.sku}), ${water.name} (SKU ${water.sku})`);

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
