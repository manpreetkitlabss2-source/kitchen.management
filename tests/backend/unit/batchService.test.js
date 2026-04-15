jest.mock('@backend/config/db');

const pool         = require('@backend/config/db');
const BatchService = require('@backend/services/batchService');

const mockConn = {
  beginTransaction: jest.fn().mockResolvedValue(undefined),
  query           : jest.fn(),
  commit          : jest.fn().mockResolvedValue(undefined),
  rollback        : jest.fn().mockResolvedValue(undefined),
  release         : jest.fn(),
};

const futureDate = (days = 30) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

beforeEach(() => {
  jest.clearAllMocks();
  pool.getConnection = jest.fn().mockResolvedValue(mockConn);
});

describe('Unit — BatchService', () => {

  // ── createBatch ───────────────────────────────────────────────────────────
  describe('createBatch', () => {
    it('throws "not found" when ingredient does not exist', async () => {
      mockConn.query.mockResolvedValueOnce([[]]); // ingredient check → empty
      await expect(
        BatchService.createBatch({ ingredient_id: 99, quantity: 5, expiry_date: futureDate(), user_id: 1, restaurant_id: 1 })
      ).rejects.toThrow('not found');
    });

    it('throws when expiry date is in the past', async () => {
      mockConn.query.mockResolvedValueOnce([[{ id: 1 }]]); // ingredient found
      await expect(
        BatchService.createBatch({ ingredient_id: 1, quantity: 5, expiry_date: '2020-01-01', user_id: 1, restaurant_id: 1 })
      ).rejects.toThrow('future');
    });

    it('creates batch, recalculates stock, returns id', async () => {
      const expiry = futureDate(10);

      // conn.query call sequence inside createBatch:
      // 1. SELECT ingredient check  → [[{ id: 1 }]]
      // 2. INSERT batch             → [{ insertId: 5 }]
      // 3. _recalculateStock SUM    → [[{ total: 10 }]]   ← must be [[{total}]]
      // 4. _recalculateStock UPDATE → [{}]
      mockConn.query
        .mockResolvedValueOnce([[{ id: 1 }]])
        .mockResolvedValueOnce([{ insertId: 5 }])
        .mockResolvedValueOnce([[{ total: 10 }]])
        .mockResolvedValueOnce([{}]);

      // getBatchDetails uses pool.query (not conn) after commit
      pool.query = jest.fn().mockResolvedValueOnce([[{
        id: 5, ingredient_id: 1, quantity: 10,
        expiry_date: expiry, created_at: new Date(),
        ingredient_name: 'Flour', unit: 'kg',
      }]]);

      const result = await BatchService.createBatch({
        ingredient_id: 1, quantity: 10, expiry_date: expiry, user_id: 1, restaurant_id: 1,
      });
      expect(result).toHaveProperty('id', 5);
    });
  });

  // ── deductStockFIFO ───────────────────────────────────────────────────────
  describe('deductStockFIFO', () => {
    it('throws when no batches are available', async () => {
      // conn.query call 1: SELECT batches → empty
      mockConn.query.mockResolvedValueOnce([[]]); // no batches
      await expect(
        BatchService.deductStockFIFO(1, 5, 1, mockConn)
      ).rejects.toThrow('No available batches');
    });

    it('throws when total available stock is insufficient', async () => {
      // Batch has only qty=2, we need 10.
      // After deducting 2 from batch, remaining=8 → throws before _recalculateStock.
      // conn.query sequence:
      // 1. SELECT batches           → [[{ id: 1, quantity: 2 }]]
      // 2. UPDATE batch (deduct 2)  → [{}]
      // Then remaining=8 > 0 → throws "Insufficient stock"
      mockConn.query
        .mockResolvedValueOnce([[{ id: 1, quantity: 2 }]])
        .mockResolvedValueOnce([{}]);

      await expect(
        BatchService.deductStockFIFO(1, 10, 1, mockConn)
      ).rejects.toThrow('Insufficient stock');
    });

    it('deducts from oldest batch first (FIFO) and returns deductions array', async () => {
      // Batch has qty=10, we need 5 → deduct 5, remaining=0 → done.
      // conn.query sequence:
      // 1. SELECT batches              → [[{ id: 1, quantity: 10 }]]
      // 2. UPDATE batch (deduct 5)     → [{}]
      // 3. _recalculateStock SUM       → [[{ total: 5 }]]
      // 4. _recalculateStock UPDATE    → [{}]
      mockConn.query
        .mockResolvedValueOnce([[{ id: 1, quantity: 10 }]])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[{ total: 5 }]])
        .mockResolvedValueOnce([{}]);

      const deductions = await BatchService.deductStockFIFO(1, 5, 1, mockConn);
      expect(deductions).toHaveLength(1);
      expect(deductions[0]).toMatchObject({ batch_id: 1, deducted: 5 });
    });

    it('deducts across multiple batches when first is not enough', async () => {
      // Batch 1: qty=3, Batch 2: qty=10 — need 8 total.
      // Deduct 3 from batch 1, then 5 from batch 2.
      // conn.query sequence:
      // 1. SELECT batches                → [[{ id: 1, qty: 3 }, { id: 2, qty: 10 }]]
      // 2. UPDATE batch 1 (deduct 3)     → [{}]
      // 3. UPDATE batch 2 (deduct 5)     → [{}]
      // 4. _recalculateStock SUM         → [[{ total: 5 }]]
      // 5. _recalculateStock UPDATE      → [{}]
      mockConn.query
        .mockResolvedValueOnce([[{ id: 1, quantity: 3 }, { id: 2, quantity: 10 }]])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[{ total: 5 }]])
        .mockResolvedValueOnce([{}]);

      const deductions = await BatchService.deductStockFIFO(1, 8, 1, mockConn);
      expect(deductions).toHaveLength(2);
      expect(deductions[0]).toMatchObject({ batch_id: 1, deducted: 3 });
      expect(deductions[1]).toMatchObject({ batch_id: 2, deducted: 5 });
    });
  });

  // ── updateBatch ───────────────────────────────────────────────────────────
  describe('updateBatch', () => {
    it('throws "not found" when batch does not exist', async () => {
      // conn.query call 1: SELECT batch → empty
      mockConn.query.mockResolvedValueOnce([[]]); // batch not found
      await expect(
        BatchService.updateBatch(999, { quantity: 10 }, 1)
      ).rejects.toThrow('not found');
    });
  });

  // ── deleteBatch ───────────────────────────────────────────────────────────
  describe('deleteBatch', () => {
    it('throws "not found" when batch does not exist', async () => {
      // conn.query call 1: SELECT batch → empty
      mockConn.query.mockResolvedValueOnce([[]]); // batch not found
      await expect(
        BatchService.deleteBatch(999, 1)
      ).rejects.toThrow('not found');
    });
  });
});
