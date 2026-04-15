jest.mock('@backend/config/db');
jest.mock('@backend/services/batchService');

const pool             = require('@backend/config/db');
const InventoryService = require('@backend/services/InventoryService');
const BatchService     = require('@backend/services/batchService');

const mockConn = {
  beginTransaction: jest.fn().mockResolvedValue(undefined),
  query           : jest.fn(),
  commit          : jest.fn().mockResolvedValue(undefined),
  rollback        : jest.fn().mockResolvedValue(undefined),
  release         : jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  pool.getConnection = jest.fn().mockResolvedValue(mockConn);
  BatchService.deductStockFIFO.mockResolvedValue(undefined);
});

describe('Unit — InventoryService', () => {

  // ── addIngredient ─────────────────────────────────────────────────────────
  describe('addIngredient', () => {
    it('inserts row and returns shaped object with string _id', async () => {
      pool.query.mockResolvedValueOnce([{ insertId: 10 }]);
      const result = await InventoryService.addIngredient({
        name: 'Tomato', unit: 'kg', current_stock: 20,
        threshold_value: 5, user_id: 1, restaurant_id: 1,
      });
      expect(result._id).toBe('10');
      expect(result.name).toBe('Tomato');
      expect(result.unit).toBe('kg');
    });
  });

  // ── deleteIngredient ──────────────────────────────────────────────────────
  describe('deleteIngredient', () => {
    it('throws "not found" when ingredient does not exist', async () => {
      pool.query.mockResolvedValueOnce([[]]); // SELECT returns empty
      await expect(InventoryService.deleteIngredient(99, 1)).rejects.toThrow('not found');
    });

    it('soft-deletes by setting deleted_at', async () => {
      pool.query
        .mockResolvedValueOnce([[{ id: 1 }]]) // SELECT
        .mockResolvedValueOnce([{}]);           // UPDATE
      await expect(InventoryService.deleteIngredient(1, 1)).resolves.toBeUndefined();
      expect(pool.query).toHaveBeenCalledTimes(2);
    });
  });

  // ── getAllIngredients ─────────────────────────────────────────────────────
  describe('getAllIngredients', () => {
    it('returns shaped paginated response', async () => {
      pool.query
        .mockResolvedValueOnce([[
          { id: 1, name: 'Salt', unit: 'grams', current_stock: 100, threshold_value: 10 },
        ]])
        .mockResolvedValueOnce([[{ total: 1 }]]);

      const result = await InventoryService.getAllIngredients({ page: 1, limit: 10, restaurant_id: 1 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]._id).toBe('1');
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  // ── recordConsumption (manual mode) ──────────────────────────────────────
  describe('recordConsumption — manual mode', () => {
    it('throws when ingredient is out of stock', async () => {
      mockConn.query.mockResolvedValueOnce([[
        { id: 1, name: 'Flour', current_stock: 0 },
      ]]);
      await expect(
        InventoryService.recordConsumption(null, [{ ingredient_id: 1, quantity_required: 1 }], 1, 1)
      ).rejects.toThrow('out of stock');
    });

    it('throws when stock is insufficient', async () => {
      mockConn.query.mockResolvedValueOnce([[
        { id: 1, name: 'Flour', current_stock: 0.5 },
      ]]);
      await expect(
        InventoryService.recordConsumption(null, [{ ingredient_id: 1, quantity_required: 5 }], 1, 1)
      ).rejects.toThrow('Not enough');
    });

    it('throws when items array is empty', async () => {
      await expect(
        InventoryService.recordConsumption(null, [], 1, 1)
      ).rejects.toThrow();
    });
  });

  // ── recordWaste ───────────────────────────────────────────────────────────
  describe('recordWaste', () => {
    it('deducts stock and inserts waste log, returns shaped object', async () => {
      BatchService.deductStockFIFO.mockResolvedValueOnce(undefined); // Mock deduction
      mockConn.query.mockResolvedValueOnce([{ insertId: 7 }]); // INSERT log

      const result = await InventoryService.recordWaste(1, 0.5, 'Expired', 1, 1);
      expect(result._id).toBe('7');
      expect(result.type).toBe('waste');
      expect(result.quantity).toBe(0.5);
    });
  });

  // ── getDashboardStats ─────────────────────────────────────────────────────
  describe('getDashboardStats', () => {
    it('returns summary, counts, recent, and metrics', async () => {
      pool.query
        .mockResolvedValueOnce([[{ total: 10, low_stock: 2, out_of_stock: 1 }]])
        .mockResolvedValueOnce([[{ total: 450 }]])
        .mockResolvedValueOnce([[{ total: 12 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      const result = await InventoryService.getDashboardStats(1);
      expect(result.summary.totalIngredients).toBe(10);
      expect(result.summary.lowStockCount).toBe(2);
      expect(result.summary.outOfStockCount).toBe(1);
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('recent');
    });
  });
});
