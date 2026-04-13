const pool = require('../config/db');

class BatchService {

  async createBatch({ ingredient_id, quantity, expiry_date, user_id, restaurant_id }) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      const [ingredientCheck] = await conn.query(
        'SELECT id FROM ingredients WHERE id = ? AND restaurant_id = ? AND deleted_at IS NULL',
        [ingredient_id, restaurant_id]
      );
      if (ingredientCheck.length === 0) throw new Error('Ingredient not found or does not belong to your restaurant.');

      const expiryDate = new Date(expiry_date);
      if (expiryDate < new Date()) throw new Error('Expiry date must be in the future.');

      const [result] = await conn.query(
        'INSERT INTO ingredient_batches (restaurant_id, user_id, ingredient_id, quantity, expiry_date) VALUES (?, ?, ?, ?, ?)',
        [restaurant_id, user_id, ingredient_id, quantity, expiry_date]
      );

      await this._recalculateStock(conn, ingredient_id, restaurant_id);
      await conn.commit();

      return { id: result.insertId, ingredient_id, quantity, expiry_date, created_at: new Date().toISOString() };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async getBatches({ page = 1, limit = 10, search, status, sortBy, sortOrder, restaurant_id }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    const filterClauses = ['b.restaurant_id = ?'];
    const params = [restaurant_id];

    if (search) {
      filterClauses.push('(i.name LIKE ? OR CAST(b.id AS CHAR) LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      const s = String(status).toLowerCase();
      if (s === 'active')       filterClauses.push('b.quantity > 0 AND b.expiry_date >= CURDATE()');
      else if (s === 'expired') filterClauses.push('b.expiry_date < CURDATE()');
      else if (s === 'out_of_stock') filterClauses.push('b.quantity = 0');
    }

    const validSortFields = { ingredient: 'i.name', quantity: 'b.quantity', expiry_date: 'b.expiry_date', created_at: 'b.created_at' };
    const orderBy = validSortFields[sortBy] || 'b.created_at';
    const orderDir = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const where = `WHERE ${filterClauses.join(' AND ')}`;

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM ingredient_batches b JOIN ingredients i ON b.ingredient_id = i.id ${where}`,
      params
    );

    const totalPages = Math.max(1, Math.ceil(total / limitNum));
    const now = new Date();

    const [rows] = await pool.query(
      `SELECT b.id, b.ingredient_id, i.name as ingredient_name, i.unit, b.quantity, b.expiry_date, b.created_at
       FROM ingredient_batches b
       JOIN ingredients i ON b.ingredient_id = i.id
       ${where} ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    return {
      data: rows.map(b => {
        const qty = Number(b.quantity);
        const exp = new Date(b.expiry_date);
        const diffDays = Math.ceil((exp - now) / 86400000);
        const bStatus = qty === 0 ? 'out_of_stock' : exp < now ? 'expired' : 'active';
        return { id: b.id, ingredient_id: b.ingredient_id, ingredient_name: b.ingredient_name, unit: b.unit, quantity: qty, expiry_date: b.expiry_date, created_at: b.created_at, status: bStatus, days_until_expiry: diffDays };
      }),
      page: pageNum, limit: limitNum, total, totalPages,
    };
  }

  async getBatchesByIngredient(ingredient_id, restaurant_id) {
    const [ingredientCheck] = await pool.query(
      'SELECT id FROM ingredients WHERE id = ? AND restaurant_id = ? AND deleted_at IS NULL',
      [ingredient_id, restaurant_id]
    );
    if (ingredientCheck.length === 0) throw new Error('Ingredient not found.');

    const [batches] = await pool.query(
      'SELECT id, ingredient_id, quantity, expiry_date, created_at FROM ingredient_batches WHERE ingredient_id = ? AND restaurant_id = ? ORDER BY expiry_date ASC, created_at ASC',
      [ingredient_id, restaurant_id]
    );
    return batches.map(b => ({ ...b, quantity: Number(b.quantity) }));
  }

  async getExpiringBatches(days = 3, restaurant_id) {
    const [batches] = await pool.query(
      `SELECT b.id, i.name as ingredient_name, i.unit, b.quantity, b.expiry_date,
              DATEDIFF(b.expiry_date, CURDATE()) as days_until_expiry
       FROM ingredient_batches b
       JOIN ingredients i ON b.ingredient_id = i.id
       WHERE b.restaurant_id = ? AND b.quantity > 0 AND DATEDIFF(b.expiry_date, CURDATE()) BETWEEN 0 AND ?
       ORDER BY b.expiry_date ASC`,
      [restaurant_id, days]
    );
    return batches.map(b => ({ ...b, quantity: Number(b.quantity), days_until_expiry: Number(b.days_until_expiry) }));
  }

  async updateBatch(batch_id, { quantity, expiry_date }, restaurant_id) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      const [batchCheck] = await conn.query(
        'SELECT ingredient_id FROM ingredient_batches WHERE id = ? AND restaurant_id = ?',
        [batch_id, restaurant_id]
      );
      if (batchCheck.length === 0) throw new Error('Batch not found.');

      const ingredient_id = batchCheck[0].ingredient_id;
      const fields = [];
      const params = [];

      if (quantity !== undefined) {
        if (typeof quantity !== 'number' || quantity < 0) throw new Error('Quantity must be a non-negative number.');
        fields.push('quantity = ?'); params.push(quantity);
      }
      if (expiry_date !== undefined) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry_date)) throw new Error('Expiry date must be in YYYY-MM-DD format.');
        if (new Date(expiry_date) < new Date()) throw new Error('Expiry date must be in the future.');
        fields.push('expiry_date = ?'); params.push(expiry_date);
      }
      if (fields.length === 0) throw new Error('No valid update fields provided.');

      params.push(batch_id, restaurant_id);
      await conn.query(`UPDATE ingredient_batches SET ${fields.join(', ')} WHERE id = ? AND restaurant_id = ?`, params);
      await this._recalculateStock(conn, ingredient_id, restaurant_id);
      await conn.commit();

      return this.getBatchDetails(batch_id, restaurant_id);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async deleteBatch(batch_id, restaurant_id) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      const [batchCheck] = await conn.query(
        'SELECT ingredient_id FROM ingredient_batches WHERE id = ? AND restaurant_id = ?',
        [batch_id, restaurant_id]
      );
      if (batchCheck.length === 0) throw new Error('Batch not found.');

      const ingredient_id = batchCheck[0].ingredient_id;
      await conn.query('DELETE FROM ingredient_batches WHERE id = ? AND restaurant_id = ?', [batch_id, restaurant_id]);
      await this._recalculateStock(conn, ingredient_id, restaurant_id);
      await conn.commit();

      return { success: true };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async deductStockFIFO(ingredient_id, quantity_needed, restaurant_id, conn = null) {
    const useConn = conn || await pool.getConnection();
    const shouldRelease = !conn;
    try {
      const [batches] = await useConn.query(
        'SELECT id, quantity FROM ingredient_batches WHERE ingredient_id = ? AND restaurant_id = ? AND quantity > 0 ORDER BY expiry_date ASC, created_at ASC',
        [ingredient_id, restaurant_id]
      );
      if (batches.length === 0) throw new Error('No available batches for this ingredient.');

      let remaining = quantity_needed;
      const deductions = [];

      for (const batch of batches) {
        const batchQty = Number(batch.quantity);
        const deduct = Math.min(remaining, batchQty);
        await useConn.query('UPDATE ingredient_batches SET quantity = quantity - ? WHERE id = ?', [deduct, batch.id]);
        deductions.push({ batch_id: batch.id, deducted: deduct });
        remaining -= deduct;
        if (remaining === 0) break;
      }

      if (remaining > 0) throw new Error(`Insufficient stock. Needed: ${quantity_needed}, Available: ${quantity_needed - remaining}.`);

      await this._recalculateStock(useConn, ingredient_id, restaurant_id);
      return deductions;
    } finally {
      if (shouldRelease) useConn.release();
    }
  }

  async getBatchDetails(batch_id, restaurant_id) {
    const [batch] = await pool.query(
      `SELECT b.id, b.ingredient_id, b.quantity, b.expiry_date, b.created_at, i.name as ingredient_name, i.unit
       FROM ingredient_batches b
       JOIN ingredients i ON b.ingredient_id = i.id
       WHERE b.id = ? AND b.restaurant_id = ?`,
      [batch_id, restaurant_id]
    );
    if (batch.length === 0) throw new Error('Batch not found.');

    const b = batch[0];
    const qty = Number(b.quantity);
    const exp = new Date(b.expiry_date);
    const diffDays = Math.ceil((exp - new Date()) / 86400000);
    const status = qty === 0 ? 'out_of_stock' : exp < new Date() ? 'expired' : 'active';

    return { id: b.id, ingredient_id: b.ingredient_id, ingredient_name: b.ingredient_name, unit: b.unit, quantity: qty, expiry_date: b.expiry_date, created_at: b.created_at, status, days_until_expiry: diffDays };
  }

  async _recalculateStock(conn, ingredient_id, restaurant_id) {
    const [[{ total }]] = await conn.query(
      'SELECT COALESCE(SUM(quantity), 0) as total FROM ingredient_batches WHERE ingredient_id = ? AND restaurant_id = ?',
      [ingredient_id, restaurant_id]
    );
    await conn.query(
      'UPDATE ingredients SET current_stock = ? WHERE id = ? AND restaurant_id = ?',
      [total, ingredient_id, restaurant_id]
    );
  }

  async recalculateIngredientStock(ingredient_id, restaurant_id) {
    const conn = await pool.getConnection();
    try {
      await this._recalculateStock(conn, ingredient_id, restaurant_id);
    } finally {
      conn.release();
    }
  }
}

module.exports = new BatchService();
