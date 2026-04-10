const pool = require('../config/db');

class BatchService {
  /**
   * Create a new batch for an ingredient
   * Validates ingredient exists and updates current_stock
   */
  async createBatch({ ingredient_id, quantity, expiry_date, user_id }) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      // Verify ingredient exists and belongs to user
      const [ingredientCheck] = await conn.query(
        'SELECT id FROM ingredients WHERE id = ? AND user_id = ?',
        [ingredient_id, user_id]
      );
      if (ingredientCheck.length === 0) {
        throw new Error('Ingredient not found');
      }

      // Validate expiry_date is in future
      const today = new Date();
      const expiryDate = new Date(expiry_date);
      if (expiryDate < today) {
        throw new Error('Expiry date must be in the future');
      }

      // Insert batch
      const [result] = await conn.query(
        'INSERT INTO ingredient_batches (user_id, ingredient_id, quantity, expiry_date) VALUES (?, ?, ?, ?)',
        [user_id, ingredient_id, quantity, expiry_date]
      );

      // Recalculate ingredient stock
      await this._recalculateIngredientStockConnection(conn, ingredient_id, user_id);

      await conn.commit();
      return {
        id: result.insertId,
        ingredient_id,
        quantity,
        expiry_date,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Get paginated batches for the authenticated user
   */
  async getBatches({ page = 1, limit = 10, search, status, sortBy, sortOrder, user_id }) {
    try {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const offset = (pageNum - 1) * limitNum;
      const filterClauses = ['b.user_id = ?'];
      const params = [user_id];

      if (search) {
        filterClauses.push('(i.name LIKE ? OR CAST(b.id AS CHAR) LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }

      if (status) {
        const normalized = String(status).toLowerCase();
        if (normalized === 'active') {
          filterClauses.push('b.quantity > 0 AND b.expiry_date >= CURDATE()');
        } else if (normalized === 'expired') {
          filterClauses.push('b.expiry_date < CURDATE()');
        } else if (normalized === 'out_of_stock') {
          filterClauses.push('b.quantity = 0');
        }
      }

      const validSortFields = {
        ingredient: 'i.name',
        quantity: 'b.quantity',
        expiry_date: 'b.expiry_date',
        created_at: 'b.created_at',
      };
      const orderBy = validSortFields[sortBy] || 'b.created_at';
      const orderDirection = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      const whereClause = filterClauses.length > 0 ? `WHERE ${filterClauses.join(' AND ')}` : '';

      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM ingredient_batches b
         JOIN ingredients i ON b.ingredient_id = i.id
         ${whereClause}`,
        params
      );

      const total = countResult[0]?.total || 0;
      const totalPages = Math.max(1, Math.ceil(total / limitNum));
      const now = new Date();

      const [rows] = await pool.query(
        `SELECT
           b.id,
           b.ingredient_id,
           i.name as ingredient_name,
           i.unit,
           b.quantity,
           b.expiry_date,
           b.created_at
         FROM ingredient_batches b
         JOIN ingredients i ON b.ingredient_id = i.id
         ${whereClause}
         ORDER BY ${orderBy} ${orderDirection}
         LIMIT ? OFFSET ?`,
        [...params, limitNum, offset]
      );

      return {
        data: rows.map((batch) => {
          const quantity = Number(batch.quantity);
          const expiryDate = new Date(batch.expiry_date);
          const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          const status = quantity === 0
            ? 'out_of_stock'
            : expiryDate < now
              ? 'expired'
              : 'active';

          return {
            id: batch.id,
            ingredient_id: batch.ingredient_id,
            ingredient_name: batch.ingredient_name,
            unit: batch.unit,
            quantity,
            expiry_date: batch.expiry_date,
            created_at: batch.created_at,
            status,
            days_until_expiry: diffDays,
          };
        }),
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all batches for a specific ingredient ordered by expiry date (FIFO)
   */
  async getBatchesByIngredient(ingredient_id, user_id) {
    try {
      // Verify ingredient exists
      const [ingredientCheck] = await pool.query(
        'SELECT id FROM ingredients WHERE id = ? AND user_id = ?',
        [ingredient_id, user_id]
      );
      if (ingredientCheck.length === 0) {
        throw new Error('Ingredient not found');
      }

      const [batches] = await pool.query(
        `SELECT id, ingredient_id, quantity, expiry_date, created_at 
         FROM ingredient_batches 
         WHERE ingredient_id = ? AND user_id = ? 
         ORDER BY expiry_date ASC, created_at ASC`,
        [ingredient_id, user_id]
      );

      return batches.map(batch => ({
        id: batch.id,
        ingredient_id: batch.ingredient_id,
        quantity: Number(batch.quantity),
        expiry_date: batch.expiry_date,
        created_at: batch.created_at
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get batches expiring within N days
   */
  async getExpiringBatches(days = 3, user_id) {
    try {
      const [batches] = await pool.query(
        `SELECT 
           b.id,
           i.name as ingredient_name,
           i.unit,
           b.quantity,
           b.expiry_date,
           DATEDIFF(b.expiry_date, CURDATE()) as days_until_expiry
         FROM ingredient_batches b
         JOIN ingredients i ON b.ingredient_id = i.id
         WHERE b.user_id = ? 
           AND b.quantity > 0
           AND DATEDIFF(b.expiry_date, CURDATE()) BETWEEN 0 AND ?
         ORDER BY b.expiry_date ASC`,
        [user_id, days]
      );

      return batches.map(batch => ({
        id: batch.id,
        ingredient_name: batch.ingredient_name,
        unit: batch.unit,
        quantity: Number(batch.quantity),
        expiry_date: batch.expiry_date,
        days_until_expiry: Number(batch.days_until_expiry)
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update batch quantity
   * Used for manual adjustments or corrections
   */
  async updateBatch(batch_id, { quantity, expiry_date }, user_id) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      // Verify batch exists and belongs to user
      const [batchCheck] = await conn.query(
        'SELECT ingredient_id FROM ingredient_batches WHERE id = ? AND user_id = ?',
        [batch_id, user_id]
      );
      if (batchCheck.length === 0) {
        throw new Error('Batch not found');
      }

      const ingredient_id = batchCheck[0].ingredient_id;
      const fields = [];
      const params = [];

      if (quantity !== undefined) {
        if (typeof quantity !== 'number' || quantity < 0) {
          throw new Error('quantity must be a non-negative number');
        }
        fields.push('quantity = ?');
        params.push(quantity);
      }

      if (expiry_date !== undefined) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(expiry_date)) {
          throw new Error('expiry_date must be in YYYY-MM-DD format');
        }
        const expiryDate = new Date(expiry_date);
        if (expiryDate < new Date()) {
          throw new Error('Expiry date must be in the future');
        }
        fields.push('expiry_date = ?');
        params.push(expiry_date);
      }

      if (fields.length === 0) {
        throw new Error('No valid update fields provided');
      }

      params.push(batch_id, user_id);
      await conn.query(
        `UPDATE ingredient_batches SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
        params
      );

      // Recalculate ingredient stock
      await this._recalculateIngredientStockConnection(conn, ingredient_id, user_id);

      const [updatedRows] = await conn.query(
        `SELECT
           b.id,
           b.ingredient_id,
           i.name as ingredient_name,
           i.unit,
           b.quantity,
           b.expiry_date,
           b.created_at
         FROM ingredient_batches b
         JOIN ingredients i ON b.ingredient_id = i.id
         WHERE b.id = ? AND b.user_id = ?`,
        [batch_id, user_id]
      );

      await conn.commit();

      if (updatedRows.length === 0) {
        throw new Error('Batch not found after update');
      }

      const batch = updatedRows[0];
      const quantityValue = Number(batch.quantity);
      const expiryDate = new Date(batch.expiry_date);
      const diffDays = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      const status = quantityValue === 0
        ? 'out_of_stock'
        : expiryDate < new Date()
          ? 'expired'
          : 'active';

      return {
        id: batch.id,
        ingredient_id: batch.ingredient_id,
        ingredient_name: batch.ingredient_name,
        unit: batch.unit,
        quantity: quantityValue,
        expiry_date: batch.expiry_date,
        created_at: batch.created_at,
        status,
        days_until_expiry: diffDays,
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Delete a batch
   * Batch is removed but ingredient stock is recalculated
   */
  async deleteBatch(batch_id, user_id) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      // Get batch info before deletion
      const [batchCheck] = await conn.query(
        'SELECT ingredient_id FROM ingredient_batches WHERE id = ? AND user_id = ?',
        [batch_id, user_id]
      );
      if (batchCheck.length === 0) {
        throw new Error('Batch not found');
      }

      const ingredient_id = batchCheck[0].ingredient_id;

      // Delete batch
      await conn.query(
        'DELETE FROM ingredient_batches WHERE id = ? AND user_id = ?',
        [batch_id, user_id]
      );

      // Recalculate ingredient stock
      await this._recalculateIngredientStockConnection(conn, ingredient_id, user_id);

      await conn.commit();
      return { success: true, message: 'Batch deleted successfully' };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Deduct stock using FIFO method
   * Used by consumption and waste logging
   * Must deduct from batches with earliest expiry dates first
   */
  async deductStockFIFO(ingredient_id, quantity_needed, user_id, conn = null) {
    const useConnection = conn || (await pool.getConnection());
    const shouldRelease = !conn;

    try {
      // Get batches ordered by expiry date (FIFO)
      const [batches] = await useConnection.query(
        `SELECT id, quantity FROM ingredient_batches 
         WHERE ingredient_id = ? AND user_id = ? AND quantity > 0
         ORDER BY expiry_date ASC, created_at ASC`,
        [ingredient_id, user_id]
      );

      if (batches.length === 0) {
        throw new Error('No available batches for this ingredient');
      }

      let remaining = quantity_needed;
      const deductions = [];

      // Deduct from batches in FIFO order
      for (const batch of batches) {
        const batch_quantity = Number(batch.quantity);
        const deduct = Math.min(remaining, batch_quantity);

        await useConnection.query(
          'UPDATE ingredient_batches SET quantity = quantity - ? WHERE id = ?',
          [deduct, batch.id]
        );

        deductions.push({
          batch_id: batch.id,
          deducted: deduct
        });

        remaining -= deduct;

        if (remaining === 0) break;
      }

      if (remaining > 0) {
        throw new Error(
          `Insufficient stock. Needed: ${quantity_needed}, Available: ${quantity_needed - remaining}`
        );
      }

      // Recalculate ingredient stock
      await this._recalculateIngredientStockConnection(useConnection, ingredient_id, user_id);

      return deductions;
    } catch (error) {
      throw error;
    } finally {
      if (shouldRelease) {
        useConnection.release();
      }
    }
  }

  /**
   * Get batch details with ingredient info
   */
  async getBatchDetails(batch_id, user_id) {
    try {
      const [batch] = await pool.query(
        `SELECT 
           b.id,
           b.ingredient_id,
           b.quantity,
           b.expiry_date,
           b.created_at,
           i.name as ingredient_name,
           i.unit
         FROM ingredient_batches b
         JOIN ingredients i ON b.ingredient_id = i.id
         WHERE b.id = ? AND b.user_id = ?`,
        [batch_id, user_id]
      );

      if (batch.length === 0) {
        throw new Error('Batch not found');
      }

      const batchRow = batch[0];
      const quantity = Number(batchRow.quantity);
      const expiryDate = new Date(batchRow.expiry_date);
      const diffDays = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      const status = quantity === 0
        ? 'out_of_stock'
        : expiryDate < new Date()
          ? 'expired'
          : 'active';

      return {
        id: batchRow.id,
        ingredient_id: batchRow.ingredient_id,
        ingredient_name: batchRow.ingredient_name,
        unit: batchRow.unit,
        quantity,
        expiry_date: batchRow.expiry_date,
        created_at: batchRow.created_at,
        status,
        days_until_expiry: diffDays,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Internal: Recalculate ingredient stock from batches
   * Sum of all batch quantities = current_stock
   */
  async _recalculateIngredientStockConnection(conn, ingredient_id, user_id) {
    const [[result]] = await conn.query(
      'SELECT COALESCE(SUM(quantity), 0) as total FROM ingredient_batches WHERE ingredient_id = ? AND user_id = ?',
      [ingredient_id, user_id]
    );

    await conn.query(
      'UPDATE ingredients SET current_stock = ? WHERE id = ? AND user_id = ?',
      [result.total, ingredient_id, user_id]
    );
  }

  /**
   * Public wrapper for recalculating stock (when using pool directly)
   */
  async recalculateIngredientStock(ingredient_id, user_id) {
    const conn = await pool.getConnection();
    try {
      await this._recalculateIngredientStockConnection(conn, ingredient_id, user_id);
    } finally {
      conn.release();
    }
  }
}

module.exports = new BatchService();
