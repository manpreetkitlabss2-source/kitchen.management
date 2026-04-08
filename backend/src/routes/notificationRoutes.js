const express = require('express');
const router = express.Router();
const notifCtrl = require('../controllers/notificationController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.use(protect, isAdmin);

// Scan ingredients and generate notifications for threshold breaches
router.post('/scan', notifCtrl.scan);

// Get paginated notifications
router.get('/', notifCtrl.getNotifications);

// Get unread count (for bell badge)
router.get('/unread-count', notifCtrl.getUnreadCount);

// Mark single notification as read
router.patch('/:id/read', notifCtrl.markAsRead);

// Mark all notifications as read
router.patch('/read-all', notifCtrl.markAllAsRead);

module.exports = router;
