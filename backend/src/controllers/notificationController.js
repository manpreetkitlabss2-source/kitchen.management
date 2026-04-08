const NotificationService = require('../services/NotificationService');

exports.scan = async (req, res) => {
  try {
    await NotificationService.scanAndNotify();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await NotificationService.getNotifications({ page: +page, limit: +limit });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const result = await NotificationService.getUnreadCount();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const result = await NotificationService.markAsRead(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const result = await NotificationService.markAllAsRead();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
