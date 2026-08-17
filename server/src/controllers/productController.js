const { Op } = require('sequelize');
const { Product, Supplier } = require('../models');

async function listProducts(req, res, next) {
  try {
    const { category, status, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (category) where.category = category;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // status (IN_STOCK/LOW_STOCK/CRITICAL/OUT_OF_STOCK) is a computed field,
    // not a column, so it can't be pushed into the WHERE clause — filter in
    // application code after fetching the name/sku/category-matched set,
    // then paginate the filtered result. Fine at this dataset size; if the
    // catalog grows large, persisting status as a generated column would let
    // this move fully into SQL.
    const matching = await Product.findAll({
      where,
      include: [{ model: Supplier, as: 'supplier' }],
      order: [['name', 'ASC']],
    });

    let result = matching.map((p) => ({ ...p.toJSON(), status: p.getStockStatus() }));
    if (status) {
      result = result.filter((p) => p.status === status);
    }

    const totalCount = result.length;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const totalPages = Math.max(1, Math.ceil(totalCount / limitNum));
    const start = (pageNum - 1) * limitNum;
    const paginated = result.slice(start, start + limitNum);

    res.json({
      products: paginated,
      count: paginated.length,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Supplier, as: 'supplier' }],
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json({ ...product.toJSON(), status: product.getStockStatus() });
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await product.update(req.body);
    res.json({ ...product.toJSON(), status: product.getStockStatus() });
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await product.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
