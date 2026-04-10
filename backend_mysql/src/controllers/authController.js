const authService = require('../services/authService');
const pool = require('../config/db');

exports.signup = async (req, res) => {
  try {
    const result = await authService.registerAdmin(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await authService.loginAdmin(email, password);
    res.status(200).json(data);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const [[user]] = await pool.query(
      'SELECT id, name, email, role, restaurantName, createdAt FROM users WHERE id = ?',
      [req.user.userId]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};