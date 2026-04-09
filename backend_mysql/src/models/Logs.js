const pool = require('../config/db');

const Log = {
  // Bulk insert: rows = [[type, ingredient_id, recipe_id, quantity], ...]
  bulkInsert: (rows) =>
    pool.query('INSERT INTO logs (type, ingredient_id, recipe_id, quantity) VALUES ?', [rows]),

  insertWaste: (ingredient_id, quantity, reason) =>
    pool.query(
      'INSERT INTO logs (type, ingredient_id, quantity, reason) VALUES (?, ?, ?, ?)',
      ['waste', ingredient_id, quantity, reason]
    ),

  findConsumption: (limit, offset) =>
    pool.query(
      `SELECT l.id, l.type, l.quantity, l.created_at,
              JSON_OBJECT('id', i.id, 'name', i.name, 'unit', i.unit) as ingredient_id,
              JSON_OBJECT('id', r.id, 'name', r.name) as recipe_id
       FROM logs l
       JOIN ingredients i ON l.ingredient_id = i.id
       JOIN recipes r ON l.recipe_id = r.id
       WHERE l.type = 'consumption'
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    ),

  findWaste: (limit, offset) =>
    pool.query(
      `SELECT l.id, l.type, l.quantity, l.reason, l.created_at,
              JSON_OBJECT('id', i.id, 'name', i.name, 'unit', i.unit) as ingredient_id
       FROM logs l
       JOIN ingredients i ON l.ingredient_id = i.id
       WHERE l.type = 'waste'
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    ),

  countByType: (type) =>
    pool.query('SELECT COUNT(*) as total FROM logs WHERE type = ?', [type]),
};

module.exports = Log;
