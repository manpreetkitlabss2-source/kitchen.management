const pool = require('../config/db');

const Notification = {
  upsert: (ingredient_id, type, message) =>
    pool.query(
      `INSERT INTO notifications (ingredient_id, type, message, is_read, created_at)
       VALUES (?, ?, ?, false, NOW())
       ON DUPLICATE KEY UPDATE is_read = false, message = VALUES(message)`,
      [ingredient_id, type, message]
    ),

  deleteByIngredient: (ingredient_id) =>
    pool.query('DELETE FROM notifications WHERE ingredient_id = ?', [ingredient_id]),

  findAll: (limit, offset) =>
    pool.query(
      `SELECT n.id, n.type, n.message, n.is_read, n.created_at,
              JSON_OBJECT(
                'id', i.id, 'name', i.name, 'unit', i.unit,
                'current_stock', i.current_stock, 'threshold_value', i.threshold_value
              ) as ingredient_id
       FROM notifications n
       JOIN ingredients i ON n.ingredient_id = i.id
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    ),

  count: () => pool.query('SELECT COUNT(*) as total FROM notifications'),

  countUnread: () =>
    pool.query('SELECT COUNT(*) as count FROM notifications WHERE is_read = false'),

  markRead: (id) =>
    pool.query('UPDATE notifications SET is_read = true WHERE id = ?', [id]),

  markAllRead: () =>
    pool.query('UPDATE notifications SET is_read = true WHERE is_read = false'),

  findById: (id) => pool.query('SELECT * FROM notifications WHERE id = ?', [id]),
};

module.exports = Notification;
