const pool = require('../config/db');

class InventoryService {
  // --- Ingredient Logic ---
  async addIngredient({ name, unit, current_stock = 0, threshold_value = 0, user_id, restaurant_id }) {
    const [result] = await pool.query(
      'INSERT INTO ingredients (restaurant_id, user_id, name, unit, current_stock, threshold_value) VALUES (?, ?, ?, ?, ?, ?)',
      [restaurant_id, user_id, name, unit, current_stock, threshold_value]
    );
    return { _id: String(result.insertId), name, unit, current_stock, threshold_value };
  }

  async editIngredient(data, user_id, restaurant_id) {
    const { _id, id, ...updateData } = data;
    const resolvedId = _id || id;
    if (!resolvedId) throw new Error('Ingredient ID is required for update');

    const keys = Object.keys(updateData).filter(k => updateData[k] !== undefined);
    if (keys.length === 0) throw new Error('No valid fields provided for update');

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = [...keys.map(k => updateData[k]), resolvedId, restaurant_id];

    await pool.query(`UPDATE ingredients SET ${setClause} WHERE id = ? AND restaurant_id = ? AND deleted_at IS NULL`, values);
    const [rows] = await pool.query('SELECT * FROM ingredients WHERE id = ? AND restaurant_id = ? AND deleted_at IS NULL', [resolvedId, restaurant_id]);
    if (!rows[0]) throw new Error('Ingredient not found. It may have been deleted.');
    const r = rows[0];
    return { _id: String(r.id), name: r.name, unit: r.unit, current_stock: r.current_stock, threshold_value: r.threshold_value };
  }

  async deleteIngredient(ingredient_id, restaurant_id) {
    const [[ingredient]] = await pool.query(
      'SELECT id FROM ingredients WHERE id = ? AND restaurant_id = ? AND deleted_at IS NULL',
      [ingredient_id, restaurant_id]
    );
    if (!ingredient) throw new Error('Ingredient not found. It may have been deleted.');
    await pool.query('UPDATE ingredients SET deleted_at = NOW() WHERE id = ? AND restaurant_id = ?', [ingredient_id, restaurant_id]);
  }

  async getAllIngredients({ page = 1, limit = 10, restaurant_id } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      'SELECT * FROM ingredients WHERE restaurant_id = ? AND deleted_at IS NULL ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      [restaurant_id, Number(limit), Number(offset)]
    );
    const data = rows.map(r => ({
      _id: String(r.id), name: r.name, unit: r.unit,
      current_stock: Number(r.current_stock),
      threshold_value: Number(r.threshold_value)
    }));
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM ingredients WHERE restaurant_id = ? AND deleted_at IS NULL', [restaurant_id]);
    return { data: data || [], page: Number(page), limit: Number(limit), total: Number(total) || 0 };
  }

  // --- Recipe Logic ---
  async createRecipe(name, ingredients, user_id, restaurant_id) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      const [result] = await conn.query('INSERT INTO recipes (restaurant_id, user_id, name) VALUES (?, ?, ?)', [restaurant_id, user_id, name]);
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

  async deleteRecipe(recipe_id, restaurant_id) {
    const [[recipe]] = await pool.query(
      'SELECT id FROM recipes WHERE id = ? AND restaurant_id = ? AND deleted_at IS NULL',
      [recipe_id, restaurant_id]
    );
    if (!recipe) throw new Error('Recipe not found. It may have been deleted.');
    await pool.query('UPDATE recipes SET deleted_at = NOW() WHERE id = ? AND restaurant_id = ?', [recipe_id, restaurant_id]);
  }

  async getAllRecipes({ page = 1, limit = 10, restaurant_id } = {}) {
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
      WHERE r.restaurant_id = ? AND r.deleted_at IS NULL
      GROUP BY r.id
      ORDER BY r.createdAt DESC
      LIMIT ? OFFSET ?
    `, [restaurant_id, Number(limit), Number(offset)]);

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

    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM recipes WHERE restaurant_id = ? AND deleted_at IS NULL', [restaurant_id]);
    return { data: data || [], page: Number(page), limit: Number(limit), total: Number(total) || 0 };
  }

  // --- Consumption Logic ---
  // Handles both modes the UI supports:
  //   Recipe mode:  recipe_id provided, items = reviewed quantities (may override defaults)
  //   Manual mode:  recipe_id = null,   items = free-form [{ ingredient_id, quantity_required }]
  async recordConsumption(recipe_id, items, user_id, restaurant_id) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      const logs = [];

      if (recipe_id) {
        // ── Recipe mode ──────────────────────────────────────────────────────
        const [recipeCheck] = await conn.query(
          'SELECT id FROM recipes WHERE id = ? AND restaurant_id = ? AND deleted_at IS NULL',
          [recipe_id, restaurant_id]
        );
        if (recipeCheck.length === 0) throw new Error('Recipe not found. It may have been deleted.');

        const [recipe_ingredients] = await conn.query(`
          SELECT ri.ingredient_id, ri.quantity_required, i.name, i.current_stock
          FROM recipe_ingredients ri
          JOIN ingredients i ON ri.ingredient_id = i.id
          WHERE ri.recipe_id = ? AND i.restaurant_id = ? AND i.deleted_at IS NULL
        `, [recipe_id, restaurant_id]);

        if (recipe_ingredients.length === 0) throw new Error('This recipe has no ingredients mapped to it.');

        // items acts as a quantity override map (UI lets user edit quantities before confirming)
        const item_map = items && items.length > 0
          ? new Map(items.map(i => [Number(i.ingredient_id), Number(i.quantity_required)]))
          : new Map();

        for (const item of recipe_ingredients) {
          const qty = item_map.get(item.ingredient_id) ?? item.quantity_required;

          if (item.current_stock <= 0) throw new Error(`"${item.name}" is currently out of stock.`);
          if (item.current_stock < qty) throw new Error(`Not enough "${item.name}" in stock. Required: ${qty}, Available: ${item.current_stock}.`);

          await conn.query(
            'UPDATE ingredients SET current_stock = current_stock - ? WHERE id = ? AND restaurant_id = ?',
            [qty, item.ingredient_id, restaurant_id]
          );
          logs.push([restaurant_id, user_id, 'consumption', item.ingredient_id, recipe_id, qty]);
        }

      } else {
        // ── Manual mode ──────────────────────────────────────────────────────
        if (!items || items.length === 0) throw new Error('At least one ingredient is required for manual consumption.');

        for (const item of items) {
          const ingredient_id = Number(item.ingredient_id);
          const qty = Number(item.quantity_required);

          if (!ingredient_id || qty <= 0) throw new Error('Each item must have a valid ingredient and quantity greater than zero.');

          const [[ingredient]] = await conn.query(
            'SELECT id, name, current_stock FROM ingredients WHERE id = ? AND restaurant_id = ? AND deleted_at IS NULL',
            [ingredient_id, restaurant_id]
          );
          if (!ingredient) throw new Error(`Ingredient not found or does not belong to this restaurant.`);
          if (ingredient.current_stock <= 0) throw new Error(`"${ingredient.name}" is currently out of stock.`);
          if (ingredient.current_stock < qty) throw new Error(`Not enough "${ingredient.name}" in stock. Required: ${qty}, Available: ${ingredient.current_stock}.`);

          await conn.query(
            'UPDATE ingredients SET current_stock = current_stock - ? WHERE id = ? AND restaurant_id = ?',
            [qty, ingredient_id, restaurant_id]
          );
          logs.push([restaurant_id, user_id, 'consumption', ingredient_id, null, qty]);
        }
      }

      await conn.query(
        'INSERT INTO logs (restaurant_id, user_id, type, ingredient_id, recipe_id, quantity) VALUES ?',
        [logs]
      );
      await conn.commit();
      return logs.map(l => ({ type: l[2], ingredient_id: l[3], recipe_id: l[4], quantity: l[5] }));
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async getConsumptionLogs({ page = 1, limit = 10, restaurant_id } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(`
      SELECT l.id, l.type, l.quantity, l.created_at,
             JSON_OBJECT('id', i.id, 'name', i.name, 'unit', i.unit) as ingredient_id,
             IF(r.id IS NOT NULL, JSON_OBJECT('id', r.id, 'name', r.name), NULL) as recipe_id
      FROM logs l
      JOIN ingredients i ON l.ingredient_id = i.id
      LEFT JOIN recipes r ON l.recipe_id = r.id
      WHERE l.type = 'consumption' AND l.restaurant_id = ?
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `, [restaurant_id, Number(limit), Number(offset)]);

    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) as total FROM logs WHERE type = 'consumption' AND restaurant_id = ?",
      [restaurant_id]
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
  async recordWaste(ingredient_id, quantity, reason, user_id, restaurant_id) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      await conn.query(
        'UPDATE ingredients SET current_stock = current_stock - ? WHERE id = ? AND restaurant_id = ?',
        [quantity, ingredient_id, restaurant_id]
      );
      const [result] = await conn.query(
        'INSERT INTO logs (restaurant_id, user_id, type, ingredient_id, quantity, reason) VALUES (?, ?, ?, ?, ?, ?)',
        [restaurant_id, user_id, 'waste', ingredient_id, quantity, reason]
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

  async getWasteLogs({ page = 1, limit = 10, restaurant_id } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(`
      SELECT l.id, l.type, l.quantity, l.reason, l.created_at,
             JSON_OBJECT('id', i.id, 'name', i.name, 'unit', i.unit) as ingredient_id
      FROM logs l
      JOIN ingredients i ON l.ingredient_id = i.id
      WHERE l.type = 'waste' AND l.restaurant_id = ?
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `, [restaurant_id, Number(limit), Number(offset)]);
    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) as total FROM logs WHERE type = 'waste' AND restaurant_id = ?",
      [restaurant_id]
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
  async getDashboardStats(restaurant_id) {
    const [[counts]] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN current_stock > 0 AND current_stock <= threshold_value THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN current_stock <= 0 THEN 1 ELSE 0 END) as out_of_stock
      FROM ingredients WHERE restaurant_id = ? AND deleted_at IS NULL
    `, [restaurant_id]);
    const [[consumption]] = await pool.query(
      "SELECT IFNULL(SUM(quantity), 0) as total FROM logs WHERE type = 'consumption' AND restaurant_id = ?",
      [restaurant_id]
    );
    const [[waste]] = await pool.query(
      "SELECT IFNULL(SUM(quantity), 0) as total FROM logs WHERE type = 'waste' AND restaurant_id = ?",
      [restaurant_id]
    );
    const [low_stock_items] = await pool.query(`
      SELECT name, unit, current_stock, threshold_value FROM ingredients
      WHERE current_stock <= threshold_value AND restaurant_id = ? AND deleted_at IS NULL
      ORDER BY current_stock ASC LIMIT 5
    `, [restaurant_id]);
    const [top_stock] = await pool.query(
      'SELECT name, current_stock FROM ingredients WHERE restaurant_id = ? AND deleted_at IS NULL ORDER BY current_stock DESC LIMIT 5',
      [restaurant_id]
    );
    const [top_waste] = await pool.query(`
      SELECT i.name, SUM(l.quantity) as total_waste
      FROM logs l
      JOIN ingredients i ON l.ingredient_id = i.id
      WHERE l.type = 'waste' AND l.restaurant_id = ?
      GROUP BY l.ingredient_id
      ORDER BY total_waste DESC LIMIT 5
    `, [restaurant_id]);
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
      recent: { lowStockItems: low_stock_items || [], topWaste: top_waste || [] },
      metrics: {
        topStock: top_stock || [],
        consumptionTotal: Number(consumption.total || 0),
        wasteTotal: Number(waste.total || 0)
      }
    };
  }

  // --- Order Logic ---
  async createOrder(items, user_id, restaurant_id) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      const [orderResult] = await conn.query(
        'INSERT INTO orders (restaurant_id, user_id, status) VALUES (?, ?, ?)',
        [restaurant_id, user_id, 'completed']
      );
      const order_id = orderResult.insertId;

      for (const item of items) {
        const { recipe_id, quantity } = item;

        const [recipeCheck] = await conn.query(
          'SELECT id FROM recipes WHERE id = ? AND restaurant_id = ? AND deleted_at IS NULL',
          [recipe_id, restaurant_id]
        );
        if (recipeCheck.length === 0) throw new Error('Recipe not found. It may have been deleted.');

        const [recipe_ingredients] = await conn.query(`
          SELECT ri.ingredient_id, ri.quantity_required, i.name, i.current_stock
          FROM recipe_ingredients ri
          JOIN ingredients i ON ri.ingredient_id = i.id
          WHERE ri.recipe_id = ? AND i.restaurant_id = ? AND i.deleted_at IS NULL
        `, [recipe_id, restaurant_id]);

        if (recipe_ingredients.length === 0) throw new Error('This recipe has no ingredients mapped to it.');

        const logs = [];
        for (const ing of recipe_ingredients) {
          const totalQty = ing.quantity_required * quantity;
          if (ing.current_stock < totalQty) {
            throw new Error(`Not enough "${ing.name}" in stock. Required: ${totalQty}, available: ${ing.current_stock}.`);
          }
          await conn.query(
            'UPDATE ingredients SET current_stock = current_stock - ? WHERE id = ? AND restaurant_id = ?',
            [totalQty, ing.ingredient_id, restaurant_id]
          );
          logs.push([restaurant_id, user_id, 'consumption', ing.ingredient_id, recipe_id, totalQty]);
        }

        if (logs.length > 0) {
          await conn.query(
            'INSERT INTO logs (restaurant_id, user_id, type, ingredient_id, recipe_id, quantity) VALUES ?',
            [logs]
          );
        }

        await conn.query(
          'INSERT INTO order_items (order_id, recipe_id, quantity) VALUES (?, ?, ?)',
          [order_id, recipe_id, quantity]
        );
      }

      await conn.commit();
      return { id: order_id, status: 'completed' };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async getOrders({ page = 1, limit = 10, restaurant_id } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(`
      SELECT o.id, o.status, o.created_at,
        JSON_ARRAYAGG(
          JSON_OBJECT('recipe_id', oi.recipe_id, 'recipe_name', IFNULL(r.name, 'Deleted Recipe'), 'quantity', oi.quantity)
        ) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN recipes r ON oi.recipe_id = r.id
      WHERE o.restaurant_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [restaurant_id, Number(limit), Number(offset)]);

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM orders WHERE restaurant_id = ?',
      [restaurant_id]
    );

    const data = rows.map(r => ({
      _id: String(r.id),
      status: r.status,
      created_at: r.created_at,
      items: (typeof r.items === 'string' ? JSON.parse(r.items) : r.items)
    }));

    return { data, page: Number(page), limit: Number(limit), total: Number(total) || 0 };
  }
}

module.exports = new InventoryService();
