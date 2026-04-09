const pool = require('../config/db');

class InventoryService {
  // --- Ingredient Logic ---
  async addIngredient({ name, unit, current_stock = 0, threshold_value = 0, user_id }) {
    const [result] = await pool.query(
      'INSERT INTO ingredients (user_id, name, unit, current_stock, threshold_value) VALUES (?, ?, ?, ?, ?)',
      [user_id, name, unit, current_stock, threshold_value]
    );
    return { _id: String(result.insertId), name, unit, current_stock, threshold_value };
  }

  async editIngredient(data, user_id) {
    const { _id, id, ...updateData } = data;
    const resolvedId = _id || id;
    if (!resolvedId) throw new Error('Ingredient ID is required for update');

    const keys = Object.keys(updateData).filter(k => updateData[k] !== undefined);
    if (keys.length === 0) throw new Error('No valid fields provided for update');

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = [...keys.map(k => updateData[k]), resolvedId, user_id];

    await pool.query(`UPDATE ingredients SET ${setClause} WHERE id = ? AND user_id = ?`, values);
    const [rows] = await pool.query('SELECT * FROM ingredients WHERE id = ? AND user_id = ?', [resolvedId, user_id]);
    if (!rows[0]) throw new Error('Ingredient not found');
    const r = rows[0];
    return { _id: String(r.id), name: r.name, unit: r.unit, current_stock: r.current_stock, threshold_value: r.threshold_value };
  }

  async getAllIngredients({ page = 1, limit = 10, user_id } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      'SELECT * FROM ingredients WHERE user_id = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      [user_id, Number(limit), Number(offset)]
    );
    const data = rows.map(r => ({
      _id: String(r.id), name: r.name, unit: r.unit,
      current_stock: r.current_stock, threshold_value: r.threshold_value
    }));
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM ingredients WHERE user_id = ?', [user_id]);
    return { data: data || [], page: Number(page), limit: Number(limit), total: Number(total) || 0 };
  }

  // --- Recipe Logic ---
  async createRecipe(name, ingredients, user_id) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      const [result] = await conn.query('INSERT INTO recipes (user_id, name) VALUES (?, ?)', [user_id, name]);
      const recipe_id = result.insertId;

      if (ingredients && ingredients.length > 0) {
        const values = ingredients.map(item => [recipe_id, item.ingredient_id, item.quantity_required]);
        await conn.query(
          'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_required) VALUES ?',
          [values]
        );
      }

      await conn.commit();
      return { _id: String(recipe_id), name };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async getAllRecipes({ page = 1, limit = 10, user_id } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(`
      SELECT r.id, r.name, r.createdAt,
             COALESCE(JSON_ARRAYAGG(
               JSON_OBJECT(
                 'ingredient_id', JSON_OBJECT('id', i.id, 'name', i.name, 'unit', i.unit),
                 'quantity_required', ri.quantity_required
               )
             ), JSON_ARRAY()) as ingredients
      FROM recipes r
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE r.user_id = ?
      GROUP BY r.id
      ORDER BY r.createdAt DESC
      LIMIT ? OFFSET ?
    `, [user_id, Number(limit), Number(offset)]);

    const data = rows.map(r => ({
      _id: String(r.id),
      name: r.name,
      ingredients: (typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients)
        .filter(item => item && item.ingredient_id && item.ingredient_id.id != null)
        .map(item => ({
          quantity_required: item.quantity_required,
          ingredient_id: {
            _id: String(item.ingredient_id.id),
            name: item.ingredient_id.name,
            unit: item.ingredient_id.unit
          }
        }))
    }));

    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM recipes WHERE user_id = ?', [user_id]);
    return { data: data || [], page: Number(page), limit: Number(limit), total: Number(total) || 0 };
  }

  // --- Consumption Logic ---
  async recordConsumption(recipe_id, items = null, user_id) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      // Verify recipe belongs to this user
      const [recipeCheck] = await conn.query(
        'SELECT id FROM recipes WHERE id = ? AND user_id = ?',
        [recipe_id, user_id]
      );
      if (recipeCheck.length === 0) throw new Error('Recipe not found');

      const [recipe_ingredients] = await conn.query(`
        SELECT ri.ingredient_id, ri.quantity_required, i.name, i.current_stock
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = ? AND i.user_id = ?
      `, [recipe_id, user_id]);

      if (recipe_ingredients.length === 0) throw new Error('Recipe not found or empty');

      const item_map = items
        ? new Map(items.map(i => [Number(i.ingredient_id), i.quantity_required]))
        : new Map();

      const logs = [];
      for (const item of recipe_ingredients) {
        const qty = item_map.get(item.ingredient_id) ?? item.quantity_required;

        if (item.current_stock <= 0) throw new Error(`${item.name} is out of stock`);
        if (item.current_stock < qty) {
          throw new Error(`Not enough stock for ${item.name}. Required: ${qty}, Available: ${item.current_stock}`);
        }

        await conn.query(
          'UPDATE ingredients SET current_stock = current_stock - ? WHERE id = ? AND user_id = ?',
          [qty, item.ingredient_id, user_id]
        );
        logs.push([user_id, 'consumption', item.ingredient_id, recipe_id, qty]);
      }

      await conn.query('INSERT INTO logs (user_id, type, ingredient_id, recipe_id, quantity) VALUES ?', [logs]);
      await conn.commit();
      return logs.map(l => ({ type: l[1], ingredient_id: l[2], recipe_id: l[3], quantity: l[4] }));
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async getConsumptionLogs({ page = 1, limit = 10, user_id } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(`
      SELECT l.id, l.type, l.quantity, l.created_at,
             JSON_OBJECT('id', i.id, 'name', i.name, 'unit', i.unit) as ingredient_id,
             JSON_OBJECT('id', r.id, 'name', r.name) as recipe_id
      FROM logs l
      JOIN ingredients i ON l.ingredient_id = i.id
      JOIN recipes r ON l.recipe_id = r.id
      WHERE l.type = 'consumption' AND l.user_id = ?
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `, [user_id, Number(limit), Number(offset)]);

    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) as total FROM logs WHERE type = 'consumption' AND user_id = ?",
      [user_id]
    );
    const data = rows.map(r => ({
      _id: String(r.id),
      type: r.type,
      quantity: Number(r.quantity),
      created_at: r.created_at,
      ingredient_id: typeof r.ingredient_id === 'string'
        ? (() => { const p = JSON.parse(r.ingredient_id); return { _id: String(p.id), name: p.name, unit: p.unit }; })()
        : { _id: String(r.ingredient_id.id), name: r.ingredient_id.name, unit: r.ingredient_id.unit },
      recipe_id: r.recipe_id
        ? (() => {
            const p = typeof r.recipe_id === 'string' ? JSON.parse(r.recipe_id) : r.recipe_id;
            return { _id: String(p.id), name: p.name };
          })()
        : null
    }));
    return { data, page: Number(page), limit: Number(limit), total: Number(total) || 0 };
  }

  // --- Waste Logic ---
  async recordWaste(ingredient_id, quantity, reason, user_id) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      await conn.query(
        'UPDATE ingredients SET current_stock = current_stock - ? WHERE id = ? AND user_id = ?',
        [quantity, ingredient_id, user_id]
      );
      const [result] = await conn.query(
        'INSERT INTO logs (user_id, type, ingredient_id, quantity, reason) VALUES (?, ?, ?, ?, ?)',
        [user_id, 'waste', ingredient_id, quantity, reason]
      );
      await conn.commit();
      return { _id: String(result.insertId), type: 'waste', ingredient_id, quantity, reason };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async getWasteLogs({ page = 1, limit = 10, user_id } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(`
      SELECT l.id, l.type, l.quantity, l.reason, l.created_at,
             JSON_OBJECT('id', i.id, 'name', i.name, 'unit', i.unit) as ingredient_id
      FROM logs l
      JOIN ingredients i ON l.ingredient_id = i.id
      WHERE l.type = 'waste' AND l.user_id = ?
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `, [user_id, Number(limit), Number(offset)]);
    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) as total FROM logs WHERE type = 'waste' AND user_id = ?",
      [user_id]
    );
    const data = rows.map(r => ({
      _id: String(r.id),
      type: r.type,
      quantity: Number(r.quantity),
      reason: r.reason,
      created_at: r.created_at,
      ingredient_id: typeof r.ingredient_id === 'string'
        ? (() => { const p = JSON.parse(r.ingredient_id); return { _id: String(p.id), name: p.name, unit: p.unit }; })()
        : { _id: String(r.ingredient_id.id), name: r.ingredient_id.name, unit: r.ingredient_id.unit }
    }));
    return { data, page: Number(page), limit: Number(limit), total: Number(total) || 0 };
  }

  // --- Dashboard Analytics ---
  async getDashboardStats(user_id) {
    const [[counts]] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN current_stock > 0 AND current_stock <= threshold_value THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN current_stock <= 0 THEN 1 ELSE 0 END) as out_of_stock
      FROM ingredients WHERE user_id = ?
    `, [user_id]);
    const [[consumption]] = await pool.query(
      "SELECT IFNULL(SUM(quantity), 0) as total FROM logs WHERE type = 'consumption' AND user_id = ?",
      [user_id]
    );
    const [[waste]] = await pool.query(
      "SELECT IFNULL(SUM(quantity), 0) as total FROM logs WHERE type = 'waste' AND user_id = ?",
      [user_id]
    );
    const [low_stock_items] = await pool.query(`
      SELECT name, unit, current_stock, threshold_value FROM ingredients
      WHERE current_stock <= threshold_value AND user_id = ?
      ORDER BY current_stock ASC LIMIT 5
    `, [user_id]);
    const [top_stock] = await pool.query(
      'SELECT name, current_stock FROM ingredients WHERE user_id = ? ORDER BY current_stock DESC LIMIT 5',
      [user_id]
    );
    const [top_waste] = await pool.query(`
      SELECT i.name, SUM(l.quantity) as total_waste
      FROM logs l
      JOIN ingredients i ON l.ingredient_id = i.id
      WHERE l.type = 'waste' AND l.user_id = ?
      GROUP BY l.ingredient_id
      ORDER BY total_waste DESC LIMIT 5
    `, [user_id]);
    return {
      summary: {
        totalIngredients: Number(counts.total || 0),
        lowStockCount: Number(counts.low_stock || 0),
        outOfStockCount: Number(counts.out_of_stock || 0),
        totalConsumption: Number(consumption.total || 0),
        totalWaste: Number(waste.total || 0)
      },
      counts: {
        ingredients: Number(counts.total || 0),
        lowStock: Number(counts.low_stock || 0),
        outOfStock: Number(counts.out_of_stock || 0)
      },
      recent: {
        lowStockItems: low_stock_items || [],
        topWaste: top_waste || []
      },
      metrics: {
        topStock: top_stock || [],
        consumptionTotal: Number(consumption.total || 0),
        wasteTotal: Number(waste.total || 0)
      }
    };
  }
}

module.exports = new InventoryService();
