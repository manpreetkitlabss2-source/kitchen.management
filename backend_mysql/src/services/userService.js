const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Roles each creator is allowed to assign
const CREATABLE_ROLES = {
  admin:   ['manager', 'chef', 'inventory_staff'],
  manager: ['chef', 'inventory_staff'],
};

const createUser = async ({ name, email, password, role, createdBy }) => {
  // 1. Fetch creator's role from MySQL
  const [[creator]] = await pool.query('SELECT role FROM users WHERE id = ?', [createdBy]);
  if (!creator) throw new Error('Creator not found');

  // 2. Enforce hierarchy
  const allowed = CREATABLE_ROLES[creator.role];
  if (!allowed) throw new Error('Your role is not permitted to create users');
  if (!allowed.includes(role)) {
    throw new Error(`A ${creator.role} cannot create a user with role "${role}"`);
  }

  // 3. Check email uniqueness
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) throw new Error('A user with this email already exists');

  // 4. Hash password and insert
  const hashedPassword = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    'INSERT INTO users (name, restaurantName, email, password, role, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [name, '', email, hashedPassword, role, createdBy]
  );

  return {
    id: result.insertId,
    name,
    email,
    role,
    created_by: createdBy,
  };
};

const getUsers = async ({ createdBy, creatorRole }) => {
  if (creatorRole === 'admin') {
    // Recursively fetch entire hierarchy created under this admin
    const [rows] = await pool.query(`
      WITH RECURSIVE user_tree AS (
        SELECT id, name, email, role, created_by, createdAt
        FROM users WHERE created_by = ?
        UNION ALL
        SELECT u.id, u.name, u.email, u.role, u.created_by, u.createdAt
        FROM users u
        INNER JOIN user_tree t ON u.created_by = t.id
      )
      SELECT * FROM user_tree ORDER BY createdAt DESC
    `, [createdBy]);
    return rows;
  }
  // Manager sees only users they directly created
  const [rows] = await pool.query(
    'SELECT id, name, email, role, created_by, createdAt FROM users WHERE created_by = ? ORDER BY createdAt DESC',
    [createdBy]
  );
  return rows;
};

const deleteUser = async ({ targetId, deleterId, deleterRole }) => {
  const [[target]] = await pool.query('SELECT id, created_by FROM users WHERE id = ?', [targetId]);
  if (!target) throw new Error('User not found');

  if (deleterRole === 'admin') {
    const [rows] = await pool.query(`
      WITH RECURSIVE user_tree AS (
        SELECT id FROM users WHERE created_by = ?
        UNION ALL
        SELECT u.id FROM users u INNER JOIN user_tree t ON u.created_by = t.id
      )
      SELECT id FROM user_tree WHERE id = ?
    `, [deleterId, targetId]);
    if (rows.length === 0) throw new Error('You can only delete users within your hierarchy');
  } else {
    if (target.created_by !== deleterId) throw new Error('You can only delete users you created');
  }

  await pool.query('DELETE FROM users WHERE id = ?', [targetId]);
};

module.exports = { createUser, getUsers, deleteUser, CREATABLE_ROLES };
