const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.use(protect);

router.post('/',                          authorize('batch:write'), batchController.addBatch);
router.get('/',                           authorize('batch:read'),  batchController.getBatches);
router.get('/expiring',                   authorize('batch:read'),  batchController.getExpiringBatches);
router.get('/ingredient/:ingredient_id',  authorize('batch:read'),  batchController.getBatchesByIngredient);
router.get('/:batch_id',                  authorize('batch:read'),  batchController.getBatchDetails);
router.put('/:batch_id',                  authorize('batch:write'), batchController.updateBatch);
router.delete('/:batch_id',               authorize('batch:write'), batchController.deleteBatch);

module.exports = router;
