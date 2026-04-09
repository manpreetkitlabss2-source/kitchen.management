const pool = require('../config/db');

const Ingredient = {
  create: (name, unit, current_stock, threshold_value) =>
    pool.query(
      'INSERT INTO ingredients (name, unit, current_stock, threshold_value) VALUES (?, ?, ?, ?)',
      [name, unit, current_stock, threshold_value]
    ),
  findById: (id) => pool.query('SELECT * FROM ingredients WHERE id = ?', [id]),
  findAll: (limit, offset) =>
    pool.query('SELECT * FROM ingredients ORDER BY createdAt DESC LIMIT ? OFFSET ?', [limit, offset]),
  update: (id, fields) => {
    const keys = Object.keys(fields);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    return pool.query(`UPDATE ingredients SET ${setClause} WHERE id = ?`, [...keys.map(k => fields[k]), id]);
  },
  count: () => pool.query('SELECT COUNT(*) as total FROM ingredients'),
};

module.exports = Ingredient;
