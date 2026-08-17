const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard', inventoryController.getDashboardMetrics);
router.get('/trend', inventoryController.getTrend);
router.get('/low-stock', inventoryController.getLowStock);
router.get('/predictions', inventoryController.getShortagePredictions);
router.get('/reorder-reports', inventoryController.getReorderReports);
router.get('/ai-predictions', inventoryController.getAiPredictions);
router.get('/ai-reorder', inventoryController.getAiReorderRecommendations);
router.get('/movements/:id', inventoryController.getMovementsForProduct);
router.post('/movements', inventoryController.createMovement);

module.exports = router;
