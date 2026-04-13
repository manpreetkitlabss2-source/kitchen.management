const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.use(protect);

router.post('/create', authorize('user:create'), userCtrl.create);
router.get('/', authorize('user:create'), userCtrl.list);

// Self soft-delete — any authenticated user can delete their own account
router.delete('/me', userCtrl.selfDelete);

// Hard delete a sub-user + all their data — only admin/manager
router.delete('/:id', authorize('user:create'), userCtrl.hardDelete);

module.exports = router;
