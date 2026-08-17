const { Op, fn, col, literal } = require('sequelize');
const { Product, StockMovement } = require('../models');
const stockService = require('../services/stockService');

async function getDashboardMetrics(req, res, next) {
  try {
    const products = await Product.findAll();

    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, p) => sum + p.current_stock, 0);
    const inventoryValue = products.reduce(
      (sum, p) => sum + p.current_stock * Number(p.cost_price),
      0
    );

    let lowStock = 0;
    let outOfStock = 0;
    let critical = 0;

    products.forEach((p) => {
      const status = p.getStockStatus();
      if (status === 'LOW_STOCK') lowStock++;
      if (status === 'CRITICAL') critical++;
      if (status === 'OUT_OF_STOCK') outOfStock++;
    });

    res.json({
      totalProducts,
      totalInventoryUnits: totalUnits,
      lowStockProducts: lowStock,
      criticalStockProducts: critical,
      outOfStockProducts: outOfStock,
      inventoryValue: Number(inventoryValue.toFixed(2)),
    });
  } catch (err) {
    next(err);
  }
}

async function getLowStock(req, res, next) {
  try {
    const products = await stockService.getLowStockProducts();
    res.json({ count: products.length, products });
  } catch (err) {
    next(err);
  }
}

async function getShortagePredictions(req, res, next) {
  try {
    const predictions = await stockService.predictAllShortages();
    res.json({ count: predictions.length, predictions });
  } catch (err) {
    next(err);
  }
}

async function getReorderReports(req, res, next) {
  try {
    const reports = await stockService.generateReorderReports();
    res.json({ count: reports.length, reports });
  } catch (err) {
    next(err);
  }
}

async function createMovement(req, res, next) {
  try {
    const { productId, type, quantityChange, note } = req.body;

    if (!productId || !type || quantityChange === undefined) {
      return res
        .status(400)
        .json({ error: 'productId, type and quantityChange are required' });
    }

    const { product, movement } = await stockService.recordStockMovement({
      productId,
      type,
      quantityChange: Number(quantityChange),
      note,
      userId: req.user?.id,
    });

    res.status(201).json({
      movement,
      product: { ...product.toJSON(), status: product.getStockStatus() },
    });
  } catch (err) {
    next(err);
  }
}

async function getMovementsForProduct(req, res, next) {
  try {
    const movements = await StockMovement.findAll({
      where: { product_id: req.params.id },
      order: [['created_at', 'DESC']],
    });
    res.json({ count: movements.length, movements });
  } catch (err) {
    next(err);
  }
}

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Proxies to the Python AI service's shortage prediction endpoint.
 * Kept as a proxy (rather than having the frontend call :8000 directly) so
 * the client only ever talks to one API, and so CORS / auth stay in one place.
 * Falls back with a clear error if the AI service is unreachable — it's
 * an optional enhancement, not a hard dependency of the Node API.
 */
async function getAiPredictions(req, res, next) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/predict/shortage`);
    if (!response.ok) {
      return res.status(502).json({ error: 'AI service returned an error' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({
      error: 'AI forecasting service is unavailable. Is it running on ' + AI_SERVICE_URL + '?',
    });
  }
}

async function getAiReorderRecommendations(req, res, next) {
  try {
    const onlyNeeded = req.query.only_needed !== 'false';
    const response = await fetch(`${AI_SERVICE_URL}/reorder?only_needed=${onlyNeeded}`);
    if (!response.ok) {
      return res.status(502).json({ error: 'AI service returned an error' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({
      error: 'AI forecasting service is unavailable. Is it running on ' + AI_SERVICE_URL + '?',
    });
  }
}

async function getTrend(req, res, next) {
  try {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 14));
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const rows = await StockMovement.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('SUM', literal('ABS(quantity_change)')), 'units'],
      ],
      where: { created_at: { [Op.gte]: since } },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    // Fill gaps so days with zero movement still show as 0, not a missing point.
    const byDate = new Map(rows.map((r) => [r.date, Number(r.units)]));
    const trend = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      trend.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        units: byDate.get(key) || 0,
      });
    }

    res.json({ days, trend });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardMetrics,
  getLowStock,
  getShortagePredictions,
  getReorderReports,
  createMovement,
  getMovementsForProduct,
  getAiPredictions,
  getAiReorderRecommendations,
  getTrend,
};
