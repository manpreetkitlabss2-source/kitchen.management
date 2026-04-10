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
      return res.status(401).json({ message: 'Not authorized' });
    }

    const [[user]] = await pool.query(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!hasPermission(user.role, permission)) {
      return res.status(403).json({
        message: `Access denied. Required permission: ${permission}`,
      });
    }

    // Attach role to req for downstream use (optional, no overhead)
    req.user.role = user.role;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Authorization check failed' });
  }
};

module.exports = { authorize };
