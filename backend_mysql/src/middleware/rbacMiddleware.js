const pool = require('../config/db');
const { hasPermission } = require('../config/roles');

/**
 * authorize(permission)
 * Express middleware factory.
 * Must be used AFTER protect middleware (req.user must be set).
 *
 * Fetches the user's role from MySQL (source of truth),
 * then checks against the static ROLES permission map.
 */
const authorize = (permission) => async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    const [[user]] = await pool.query(
      'SELECT role, restaurant_id FROM users WHERE id = ? AND deleted_at IS NULL',
      [userId]
    );

    if (!user) {
      return res.status(401).json({ message: 'Your account no longer exists or has been deactivated.' });
    }

    if (!hasPermission(user.role, permission)) {
      return res.status(403).json({
        message: `You don't have permission to perform this action.`,
      });
    }

    req.user.role = user.role;
    req.user.restaurantId = user.restaurant_id;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Authorization check failed' });
  }
};

module.exports = { authorize };
