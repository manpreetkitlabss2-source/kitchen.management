const pool = require('../config/db');

const User = {
  findByEmail: (email) => pool.query('SELECT * FROM users WHERE email = ?', [email]),
  create: (name, restaurantName, email, password) =>
    pool.query(
      'INSERT INTO users (name, restaurantName, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, restaurantName, email, password, 'admin']
    ),
  findById: (id) => pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [id]),
};

module.exports = User;
