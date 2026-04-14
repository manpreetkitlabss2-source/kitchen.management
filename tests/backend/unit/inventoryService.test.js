const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../setup/.env.test') });

jest.mock('../../../../backend_mysql/src/config/db');

const pool = require('../../../../backend_mysql/src/config/db');
const InventoryService = require('../../../../backend_mysql/src/services/InventoryService');

const mockConn = {
  beginTransaction: jest.fn(),
  query: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  pool.getConnection = jest.fn().mockResolvedValue(mockConn);
});

describe('InventoryService', () => {
  describe('addIngredient', () => {
    it('inserts and returns ingredient', async () => {
      pool.query.mockResolvedValueOnce([{ insertId: 10 }]);
      const result = await InventoryService.addIngredient({
        name: 'Tomato', unit: 'kg', current_stock: 20, threshold_value: 5,
        user_id: 1, restaurant_id: 1,
      });
      expect(result._id).toBe('10');
      expect(result.name).toBe('Tomato');
    });
  });

  describe('deleteIngredient', () => {
    it('throws if ingredient not found', async () => {
      pool.query.mockResolvedValueOnce([[]]); // SELECT returns empty
      await expect(InventoryService.deleteIngredient(99, 1)).rejects.toThrow('not found');
    });

    it('soft-deletes ingredient', async () => {
      pool.query
        .mockResolvedValueOnce([[{ id: 1 }]])  // SELECT
        .mockResolvedValueOnce([{}]);            // UPDATE
      await expect(InventoryService.deleteIngredient(1, 1)).resolves.toBeUndefined();
    });
  });

  describe('getAllIngredients', () => {
    it('returns paginated data', async () => {
      pool.query
        .mockResolvedValueOnce([[{ id: 1, name: 'Salt', unit: 'grams', current_stock: 100, threshold_value: 10 }]])
        .mockResolvedValueOnce([[{ total: 1 }]]);
      const result = await InventoryService.getAllIngredients({ page: 1, limit: 10, restaurant_id: 1 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('recordConsumption - manual mode', () => {
    it('throws if ingredient has insufficient stock', async () => {
      mockConn.query
        .mockResolvedValueOnce([[{ id: 1, name: 'Flour', current_stock: 0.5 }]])  // SELECT ingredient
      await expect(
        InventoryService.recordConsumption(null, [{ ingredient_id: 1, quantity_required: 5 }], 1, 1)
      ).rejects.toThrow('Not enough');
    });
  });

  describe('recordWaste', () => {
    it('deducts stock and inserts waste log', async () => {
      mockConn.query
        .mockResolvedValueOnce([{}])                  // UPDATE stock
        .mockResolvedValueOnce([{ insertId: 7 }]);    // INSERT log
      const result = await InventoryService.recordWaste(1, 0.5, 'Expired', 1, 1);
      expect(result._id).toBe('7');
      expect(result.type).toBe('waste');
    });
  });
});
