const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../setup/.env.test') });

jest.mock('../../../../backend_mysql/src/config/db');

const pool = require('../../../../backend_mysql/src/config/db');
const authService = require('../../../../backend_mysql/src/services/authService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('authService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('registerAdmin', () => {
    it('throws if email already exists', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
      await expect(
        authService.registerAdmin({ email: 'a@b.com', password: 'pass', name: 'A', restaurantName: 'R' })
      ).rejects.toThrow('already exists');
    });

    it('creates admin and returns token', async () => {
      pool.query
        .mockResolvedValueOnce([[]])                          // SELECT existing
        .mockResolvedValueOnce([{ insertId: 42 }])           // INSERT user
        .mockResolvedValueOnce([{}]);                         // UPDATE restaurant_id

      const result = await authService.registerAdmin({
        email: 'new@test.com', password: 'pass', name: 'New', restaurantName: 'Rest',
      });

      expect(result).toHaveProperty('token');
      expect(result.success).toBe(true);
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(42);
      expect(decoded.role).toBe('admin');
    });
  });

  describe('loginAdmin', () => {
    it('throws if user not found', async () => {
      pool.query.mockResolvedValueOnce([[]]);
      await expect(authService.loginAdmin('x@x.com', 'pass')).rejects.toThrow('No account found');
    });

    it('throws on wrong password', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      pool.query.mockResolvedValueOnce([[{ id: 1, password: hashed, role: 'admin', restaurant_id: 1, name: 'A' }]]);
      await expect(authService.loginAdmin('a@b.com', 'wrong')).rejects.toThrow('Incorrect password');
    });

    it('returns token on valid credentials', async () => {
      const hashed = await bcrypt.hash('pass123', 10);
      pool.query.mockResolvedValueOnce([[{ id: 5, password: hashed, role: 'admin', restaurant_id: 5, name: 'Admin' }]]);
      const result = await authService.loginAdmin('a@b.com', 'pass123');
      expect(result).toHaveProperty('token');
      expect(result.user.role).toBe('admin');
    });
  });
});
