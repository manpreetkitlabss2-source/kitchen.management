const pool = require('../config/db');

const Recipe = {
  create: (name) => pool.query('INSERT INTO recipes (name) VALUES (?)', [name]),
  findById: (id) => pool.query('SELECT * FROM recipes WHERE id = ?', [id]),
  findAll: (limit, offset) =>
    pool.query(
      `SELECT r.id, r.name, r.createdAt,
              COALESCE(JSON_ARRAYAGG(
                JSON_OBJECT(
                  'ingredient_id', JSON_OBJECT('id', i.id, 'name', i.name, 'unit', i.unit),
                  'quantity_required', ri.quantity_required
                )
              ), JSON_ARRAY()) as ingredients
       FROM recipes r
       LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
       LEFT JOIN ingredients i ON ri.ingredient_id = i.id
       GROUP BY r.id
       ORDER BY r.createdAt DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    ),
  count: () => pool.query('SELECT COUNT(*) as total FROM recipes'),
  addIngredients: (recipeId, values) =>
    pool.query('INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_required) VALUES ?', [values]),
  getIngredients: (recipeId) =>
    pool.query(
      `SELECT ri.*, i.name, i.current_stock
       FROM recipe_ingredients ri
       JOIN ingredients i ON ri.ingredient_id = i.id
       WHERE ri.recipe_id = ?`,
      [recipeId]
    ),
};

module.exports = Recipe;
