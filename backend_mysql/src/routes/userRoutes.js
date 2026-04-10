const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.use(protect);

router.post('/create',      authorize('user:create'), userCtrl.create);
router.get('/',            authorize('user:create'), userCtrl.list);
router.delete('/:id',      authorize('user:create'), userCtrl.remove);

module.exports = router;
