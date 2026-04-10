const express = require('express');
const router = express.Router();
const notifCtrl = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.use(protect);

router.post('/scan',            authorize('notification:write'), notifCtrl.scan);
router.get('/',                 authorize('notification:read'),  notifCtrl.getNotifications);
router.get('/unread-count',     authorize('notification:read'),  notifCtrl.getUnreadCount);
router.patch('/:id/read',       authorize('notification:read'),  notifCtrl.markAsRead);
router.patch('/read-all',       authorize('notification:read'),  notifCtrl.markAllAsRead);

module.exports = router;
