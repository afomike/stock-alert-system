const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', productController.listProducts);
router.get('/:id', productController.getProduct);
router.post('/', authorize('admin', 'manager'), productController.createProduct);
router.put('/:id', authorize('admin', 'manager'), productController.updateProduct);
router.delete('/:id', authorize('admin'), productController.deleteProduct);

module.exports = router;
