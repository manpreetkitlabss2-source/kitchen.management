const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../setup/.env.test') });

jest.mock('../../../../backend_mysql/src/config/db');

const pool = require('../../../../backend_mysql/src/config/db');
const BatchService = require('../../../../backend_mysql/src/services/batchService');

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

describe('BatchService', () => {
  describe('createBatch', () => {
    it('throws if ingredient not found', async () => {
      mockConn.query.mockResolvedValueOnce([[]]); // ingredient check fails
      await expect(
        BatchService.createBatch({ ingredient_id: 99, quantity: 5, expiry_date: '2099-01-01', user_id: 1, restaurant_id: 1 })
      ).rejects.toThrow('not found');
    });

    it('throws if expiry date is in the past', async () => {
      mockConn.query.mockResolvedValueOnce([[{ id: 1 }]]); // ingredient found
      await expect(
        BatchService.createBatch({ ingredient_id: 1, quantity: 5, expiry_date: '2020-01-01', user_id: 1, restaurant_id: 1 })
      ).rejects.toThrow('future');
    });

    it('creates batch and recalculates stock', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);
      const expiryStr = future.toISOString().split('T')[0];

      mockConn.query
        .mockResolvedValueOnce([[{ id: 1 }]])          // ingredient check
        .mockResolvedValueOnce([{ insertId: 5 }])      // INSERT batch
        .mockResolvedValueOnce([[{ total: 10 }]])       // SUM for recalculate
        .mockResolvedValueOnce([{}]);                   // UPDATE stock

      pool.query = jest.fn()
        .mockResolvedValueOnce([[{ id: 5, ingredient_id: 1, quantity: 10, expiry_date: expiryStr, created_at: new Date(), ingredient_name: 'Flour', unit: 'kg' }]]);

      const result = await BatchService.createBatch({ ingredient_id: 1, quantity: 10, expiry_date: expiryStr, user_id: 1, restaurant_id: 1 });
      expect(result).toHaveProperty('id', 5);
    });
  });

  describe('deductStockFIFO', () => {
    it('throws if no batches available', async () => {
      mockConn.query.mockResolvedValueOnce([[]]); // no batches
      await expect(
        BatchService.deductStockFIFO(1, 5, 1, mockConn)
      ).rejects.toThrow('No available batches');
    });

    it('throws if insufficient total stock', async () => {
      mockConn.query
        .mockResolvedValueOnce([[{ id: 1, quantity: 2 }]])  // batches
        .mockResolvedValueOnce([{}])                         // UPDATE batch
        .mockResolvedValueOnce([[{ total: 0 }]])             // recalculate
        .mockResolvedValueOnce([{}]);                        // UPDATE ingredient
      await expect(
        BatchService.deductStockFIFO(1, 10, 1, mockConn)
      ).rejects.toThrow('Insufficient stock');
    });
  });
});
