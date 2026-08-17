const { Op } = require('sequelize');
const { Supplier, Product } = require('../models');

async function listSuppliers(req, res, next) {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));

    const { count, rows } = await Supplier.findAndCountAll({
      where,
      include: [{ model: Product, as: 'products', attributes: ['id', 'name', 'sku'] }],
      order: [['name', 'ASC']],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      distinct: true, // required for an accurate count when joining a hasMany
    });

    res.json({
      suppliers: rows,
      count: rows.length,
      totalCount: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(count / limitNum)),
    });
  } catch (err) {
    next(err);
  }
}

async function createSupplier(req, res, next) {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (err) {
    next(err);
  }
}

async function updateSupplier(req, res, next) {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    await supplier.update(req.body);
    res.json(supplier);
  } catch (err) {
    next(err);
  }
}

async function deleteSupplier(req, res, next) {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    await supplier.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listSuppliers, createSupplier, updateSupplier, deleteSupplier };
