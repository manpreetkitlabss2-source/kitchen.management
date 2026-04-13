const pool = require('../config/db');

class NotificationService {

  async scanAndNotify(user_id, restaurant_id) {
    const [ingredients] = await pool.query(
      'SELECT * FROM ingredients WHERE restaurant_id = ? AND deleted_at IS NULL',
      [restaurant_id]
    );

    const checks = ingredients.map(async (ing) => {
      const type = ing.current_stock <= 0
        ? 'out_of_stock'
        : ing.current_stock < ing.threshold_value
          ? 'low_stock'
          : null;

      if (!type) {
        await pool.query(
          'DELETE FROM notifications WHERE ingredient_id = ? AND restaurant_id = ?',
          [ing.id, restaurant_id]
        );
        return;
      }

      const message = type === 'out_of_stock'
        ? `${ing.name} is out of stock`
        : `${ing.name} is running low (${ing.current_stock} ${ing.unit} remaining, threshold: ${ing.threshold_value})`;

      await pool.query(`
        INSERT INTO notifications (restaurant_id, user_id, ingredient_id, type, message, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, false, NOW())
        ON DUPLICATE KEY UPDATE is_read = false, message = VALUES(message)
      `, [restaurant_id, user_id, ing.id, type, message]);
    });

    await Promise.all(checks);
  }

  async getNotifications({ page = 1, limit = 20, restaurant_id } = {}) {
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(`
      SELECT n.id, n.type, n.message, n.is_read, n.created_at,
             JSON_OBJECT(
               'id', i.id, 'name', i.name, 'unit', i.unit,
               'current_stock', i.current_stock, 'threshold_value', i.threshold_value
             ) as ingredient_id
      FROM notifications n
      JOIN ingredients i ON n.ingredient_id = i.id
      WHERE n.restaurant_id = ?
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `, [restaurant_id, Number(limit), Number(offset)]);

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM notifications WHERE restaurant_id = ?',
      [restaurant_id]
    );

    const formattedData = rows.map(row => {
      const ing = typeof row.ingredient_id === 'string' ? JSON.parse(row.ingredient_id) : row.ingredient_id;
      return {
        _id: String(row.id),
        type: row.type,
        message: row.message,
        is_read: Boolean(row.is_read),
        created_at: row.created_at,
        ingredient_id: {
          _id: String(ing.id),
          name: ing.name,
          unit: ing.unit,
          current_stock: ing.current_stock,
          threshold_value: ing.threshold_value
        }
      };
    });

    return { data: formattedData || [], page: Number(page), limit: Number(limit), total: Number(total) || 0 };
  }

  async getUnreadCount(restaurant_id) {
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE is_read = false AND restaurant_id = ?',
      [restaurant_id]
    );
    return { count: Number(count || 0) };
  }

  async markAsRead(id, restaurant_id) {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = ? AND restaurant_id = ?',
      [id, restaurant_id]
    );
    if (result.affectedRows === 0) throw new Error('Notification not found');

    const [[n]] = await pool.query('SELECT * FROM notifications WHERE id = ? AND restaurant_id = ?', [id, restaurant_id]);
    return {
      _id: String(n.id),
      type: n.type,
      message: n.message,
      is_read: Boolean(n.is_read),
      created_at: n.created_at
    };
  }

  async markAllAsRead(restaurant_id) {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE is_read = false AND restaurant_id = ?',
      [restaurant_id]
    );
    return { success: true };
  }
}

module.exports = new NotificationService();
