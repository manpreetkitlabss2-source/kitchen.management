const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const CREATABLE_ROLES = {
  admin:   ['manager', 'chef', 'inventory_staff'],
  manager: ['chef', 'inventory_staff'],
};

// ─── Create ───────────────────────────────────────────────────────────────────

const createUser = async ({ name, email, password, role, createdBy }) => {
  const [[creator]] = await pool.query(
    'SELECT role, restaurant_id FROM users WHERE id = ? AND deleted_at IS NULL',
    [createdBy]
  );
  if (!creator) throw new Error('Your session is invalid. Please log in again.');
  if (!creator.restaurant_id) throw new Error('Creator has no restaurant assigned. Please contact support.');

  const allowed = CREATABLE_ROLES[creator.role];
  if (!allowed) throw new Error('Your role does not have permission to create users.');
  if (!allowed.includes(role)) {
    throw new Error(`A ${creator.role} cannot assign the "${role}" role. Allowed roles: ${allowed.join(', ')}.`);
  }

  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
    [email]
  );
  if (existing.length > 0) throw new Error('A user with this email address already exists.');

  const hashedPassword = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    'INSERT INTO users (name, restaurantName, email, password, role, restaurant_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, '', email, hashedPassword, role, creator.restaurant_id, createdBy]
  );

  return { id: result.insertId, name, email, role, restaurant_id: creator.restaurant_id, created_by: createdBy };
};

// ─── List ─────────────────────────────────────────────────────────────────────

const getUsers = async ({ createdBy, creatorRole }) => {
  if (creatorRole === 'admin') {
    const [rows] = await pool.query(`
      WITH RECURSIVE user_tree AS (
        SELECT id, name, email, role, created_by, createdAt
        FROM users WHERE created_by = ? AND deleted_at IS NULL
        UNION ALL
        SELECT u.id, u.name, u.email, u.role, u.created_by, u.createdAt
        FROM users u
        INNER JOIN user_tree t ON u.created_by = t.id
        WHERE u.deleted_at IS NULL
      )
      SELECT * FROM user_tree ORDER BY createdAt DESC
    `, [createdBy]);
    return rows;
  }
  const [rows] = await pool.query(
    'SELECT id, name, email, role, created_by, createdAt FROM users WHERE created_by = ? AND deleted_at IS NULL ORDER BY createdAt DESC',
    [createdBy]
  );
  return rows;
};

// ─── Soft delete (self-initiated from profile — non-admin roles only) ──────────
// NOTE: Only admin can delete their own account (hard delete via hardDeleteAdmin)

const softDeleteSelf = async (userId) => {
  const [[user]] = await pool.query(
    'SELECT id, role FROM users WHERE id = ? AND deleted_at IS NULL',
    [userId]
  );
  if (!user) throw new Error('Account not found or has already been deleted.');
  if (user.role === 'admin') throw new Error('Admin accounts cannot be soft-deleted. Use the full account deletion flow.');
  await pool.query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [userId]);
};

// ─── Hard delete self (admin only — wipes all their own data) ─────────────────

const hardDeleteSelf = async (userId) => {
  const [[user]] = await pool.query(
    'SELECT id, role FROM users WHERE id = ? AND deleted_at IS NULL',
    [userId]
  );
  if (!user) throw new Error('Account not found or has already been deleted.');
  if (user.role !== 'admin') throw new Error('Only admin accounts can use this deletion method.');

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    await conn.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)', [userId]);
    await conn.query('DELETE FROM orders WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM logs WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM ingredient_batches WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE user_id = ?)', [userId]);
    await conn.query('DELETE FROM recipes WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM ingredients WHERE user_id = ?', [userId]);
    // Soft-delete the admin row so created_by FK on sub-users is preserved
    await conn.query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [userId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ─── Hard delete (admin removes a sub-user + all their data) ──────────────────
// Deletes: notifications → logs → ingredient_batches → recipe_ingredients
//          → recipes → ingredients → orders/order_items → user row

const hardDeleteUser = async ({ targetId, deleterId, deleterRole }) => {
  const [[target]] = await pool.query(
    'SELECT id, role, created_by FROM users WHERE id = ? AND deleted_at IS NULL',
    [targetId]
  );
  if (!target) throw new Error('User not found or has already been deleted.');

  if (target.role === 'admin') throw new Error('Admin accounts cannot be deleted through this action.');

  if (deleterRole === 'admin') {
    const [rows] = await pool.query(`
      WITH RECURSIVE user_tree AS (
        SELECT id FROM users WHERE created_by = ? AND deleted_at IS NULL
        UNION ALL
        SELECT u.id FROM users u
        INNER JOIN user_tree t ON u.created_by = t.id
        WHERE u.deleted_at IS NULL
      )
      SELECT id FROM user_tree WHERE id = ?
    `, [deleterId, targetId]);
    if (rows.length === 0) throw new Error('You can only delete users that belong to your hierarchy.');
  } else {
    if (target.created_by !== deleterId) throw new Error('You can only delete users that you personally created.');
  }

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    // Delete in FK-safe order
    await conn.query('DELETE FROM notifications WHERE user_id = ?', [targetId]);
    await conn.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)', [targetId]);
    await conn.query('DELETE FROM orders WHERE user_id = ?', [targetId]);
    await conn.query('DELETE FROM logs WHERE user_id = ?', [targetId]);
    await conn.query('DELETE FROM ingredient_batches WHERE user_id = ?', [targetId]);
    // recipe_ingredients cascade from recipes
    await conn.query('DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE user_id = ?)', [targetId]);
    await conn.query('DELETE FROM recipes WHERE user_id = ?', [targetId]);
    await conn.query('DELETE FROM ingredients WHERE user_id = ?', [targetId]);
    // Soft-delete the user row (preserves created_by references on other users they created)
    await conn.query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [targetId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { createUser, getUsers, softDeleteSelf, hardDeleteSelf, hardDeleteUser, CREATABLE_ROLES };
