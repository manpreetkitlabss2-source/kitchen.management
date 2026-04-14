const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../setup/.env.test') });

const { query, closePool } = require('../utils/dbHelper');
const { makeIngredient } = require('../utils/testDataFactory');

describe('Database: ingredient_batches table', () => {
  let restaurantId;
  let userId;
  let ingredientId;
  let batchId;

  const futureDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  beforeAll(async () => {
    const userResult = await query(
      "INSERT INTO users (name, restaurantName, email, password, role) VALUES (?, ?, ?, ?, ?)",
      ['Batch DB User', 'Batch Rest', `db_batch_${Date.now()}@test.com`, 'hashed', 'admin']
    );
    userId = userResult.insertId;
    await query('UPDATE users SET restaurant_id = ? WHERE id = ?', [userId, userId]);
    restaurantId = userId;

    const ing = makeIngredient();
    const ingResult = await query(
      'INSERT INTO ingredients (restaurant_id, user_id, name, unit, current_stock, threshold_value) VALUES (?, ?, ?, ?, ?, ?)',
      [restaurantId, userId, ing.name, ing.unit, 0, 5]
    );
    ingredientId = ingResult.insertId;
  });

  afterAll(async () => {
    if (batchId) await query('DELETE FROM ingredient_batches WHERE id = ?', [batchId]);
    await query('DELETE FROM ingredients WHERE id = ?', [ingredientId]);
    await query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [userId]);
    await closePool();
  });

  it('inserts a batch linked to an ingredient', async () => {
    const result = await query(
      'INSERT INTO ingredient_batches (restaurant_id, user_id, ingredient_id, quantity, expiry_date) VALUES (?, ?, ?, ?, ?)',
      [restaurantId, userId, ingredientId, 15, futureDate()]
    );
    expect(result.insertId).toBeGreaterThan(0);
    batchId = result.insertId;
  });

  it('reads batch with ingredient join', async () => {
    const rows = await query(
      `SELECT b.id, b.quantity, i.name as ingredient_name
       FROM ingredient_batches b JOIN ingredients i ON b.ingredient_id = i.id
       WHERE b.id = ?`,
      [batchId]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].quantity).toBeDefined();
    expect(rows[0].ingredient_name).toBeDefined();
  });

  it('updates batch quantity', async () => {
    await query('UPDATE ingredient_batches SET quantity = 30 WHERE id = ?', [batchId]);
    const rows = await query('SELECT quantity FROM ingredient_batches WHERE id = ?', [batchId]);
    expect(Number(rows[0].quantity)).toBe(30);
  });

  it('deletes the batch', async () => {
    await query('DELETE FROM ingredient_batches WHERE id = ?', [batchId]);
    const rows = await query('SELECT id FROM ingredient_batches WHERE id = ?', [batchId]);
    expect(rows).toHaveLength(0);
    batchId = null;
  });
});
