const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerAdmin = async ({ email, password, name, restaurantName }) => {
  // /signup is exclusively for creating the first admin account.
  // All other roles must be created by an admin or manager via POST /api/users/create.
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) throw new Error('An account with this email address already exists. Please use a different email.');

  const hashedPassword = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    'INSERT INTO users (name, restaurantName, email, password, role) VALUES (?, ?, ?, ?, ?)',
    [name, restaurantName, email, hashedPassword, 'admin']
  );

  const adminId = result.insertId;

  // Admin IS the restaurant owner — restaurant_id = their own user id
  await pool.query('UPDATE users SET restaurant_id = ? WHERE id = ?', [adminId, adminId]);

  const token = jwt.sign(
    { userId: adminId, role: 'admin', restaurantId: adminId },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return { token, success: true };
};

const loginAdmin = async (email, password) => {
  const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL', [email]);

  if (users.length === 0) throw new Error('No account found with that email address.');

  const user = users[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Incorrect password. Please try again.');

  const token = jwt.sign(
    { userId: user.id, role: user.role, restaurantId: user.restaurant_id },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return { token, success: true, user: { id: user.id, name: user.name, role: user.role, restaurantId: user.restaurant_id } };
};

module.exports = { registerAdmin, loginAdmin };
