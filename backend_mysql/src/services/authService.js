const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerAdmin = async ({ email, password, name, restaurantName }) => {
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  
  if (existing.length > 0) throw new Error('Admin already exists', test);

  const hashedPassword = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    'INSERT INTO users (name, restaurantName, email, password, role) VALUES (?, ?, ?, ?, ?)',
    [name, restaurantName, email, hashedPassword, 'admin']
  );

  const token = jwt.sign(
    { userId: result.insertId, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { token, success: true };
};

const loginAdmin = async (email, password) => {
  console.log('Attempting login for:', email);
  const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (users.length === 0) throw new Error('Invalid credentials');

  const user = users[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { token, success: true, user: { id: user.id, name: user.name, role: user.role } };
};

module.exports = { registerAdmin, loginAdmin };
