const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', supplierController.listSuppliers);
router.post('/', authorize('admin', 'manager'), supplierController.createSupplier);
router.put('/:id', authorize('admin', 'manager'), supplierController.updateSupplier);
router.delete('/:id', authorize('admin'), supplierController.deleteSupplier);

module.exports = router;
