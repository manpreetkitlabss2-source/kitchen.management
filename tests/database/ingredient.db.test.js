const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../setup/.env.test') });

const { query, closePool } = require('../utils/dbHelper');
const { makeIngredient } = require('../utils/testDataFactory');

// These tests require a real test DB with the schema applied.
// They insert/update/delete directly via SQL to verify DB constraints.

describe('Database: ingredients table', () => {
  let restaurantId;
  let userId;
  let insertedId;

  beforeAll(async () => {
    // Insert a minimal user + restaurant for FK references
    const result = await query(
      "INSERT INTO users (name, restaurantName, email, password, role) VALUES (?, ?, ?, ?, ?)",
      ['DB Test User', 'DB Rest', `db_ing_${Date.now()}@test.com`, 'hashed', 'admin']
    );
    userId = result.insertId;
    await query('UPDATE users SET restaurant_id = ? WHERE id = ?', [userId, userId]);
    restaurantId = userId;
  });

  afterAll(async () => {
    if (insertedId) await query('DELETE FROM ingredients WHERE id = ?', [insertedId]);
    await query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [userId]);
    await closePool();
  });

  it('inserts a valid ingredient', async () => {
    const ing = makeIngredient();
    const result = await query(
      'INSERT INTO ingredients (restaurant_id, user_id, name, unit, current_stock, threshold_value) VALUES (?, ?, ?, ?, ?, ?)',
      [restaurantId, userId, ing.name, ing.unit, ing.currentStock, ing.minThreshold]
    );
    expect(result.insertId).toBeGreaterThan(0);
    insertedId = result.insertId;
  });

  it('reads the inserted ingredient back', async () => {
    const rows = await query('SELECT * FROM ingredients WHERE id = ?', [insertedId]);
    expect(rows).toHaveLength(1);
    expect(rows[0].restaurant_id).toBe(restaurantId);
  });

  it('updates current_stock', async () => {
    await query('UPDATE ingredients SET current_stock = 999 WHERE id = ?', [insertedId]);
    const rows = await query('SELECT current_stock FROM ingredients WHERE id = ?', [insertedId]);
    expect(Number(rows[0].current_stock)).toBe(999);
  });

  it('soft-deletes via deleted_at', async () => {
    await query('UPDATE ingredients SET deleted_at = NOW() WHERE id = ?', [insertedId]);
    const rows = await query('SELECT * FROM ingredients WHERE id = ? AND deleted_at IS NULL', [insertedId]);
    expect(rows).toHaveLength(0);
  });
});
