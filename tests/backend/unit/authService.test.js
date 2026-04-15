jest.mock('@backend/config/db');

const pool        = require('@backend/config/db');
const authService = require('@backend/services/authService');
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');

// Use env-sourced values — never hardcode credentials in test files
const CORRECT_PASS = process.env.TEST_CORRECT_PASS || 'correct_pass_env';
const WRONG_PASS   = process.env.TEST_WRONG_PASS   || 'wrong_pass_env';
const VALID_PASS   = process.env.TEST_VALID_PASS   || 'valid_pass_env';

describe('Unit — authService', () => {
  afterEach(() => jest.clearAllMocks());

  // ── registerAdmin ─────────────────────────────────────────────────────────
  describe('registerAdmin', () => {
    const payload = {
      email         : 'unit_test_admin@kitchenpro.test',
      password      : VALID_PASS,
      name          : 'Unit Test Admin',
      restaurantName: 'Unit Test Restaurant',
    };

    it('throws if email already exists', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
      await expect(authService.registerAdmin(payload)).rejects.toThrow('already exists');
    });

    it('creates admin, sets restaurant_id = userId, returns token', async () => {
      pool.query
        .mockResolvedValueOnce([[]])               // SELECT — no existing user
        .mockResolvedValueOnce([{ insertId: 42 }]) // INSERT user
        .mockResolvedValueOnce([{}]);               // UPDATE restaurant_id

      const result = await authService.registerAdmin(payload);

      expect(result.success).toBe(true);
      expect(typeof result.token).toBe('string');

      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(42);
      expect(decoded.role).toBe('admin');
      expect(decoded.restaurantId).toBe(42);
    });
  });

  // ── loginAdmin ────────────────────────────────────────────────────────────
  describe('loginAdmin', () => {
    it('throws if no user found for email', async () => {
      pool.query.mockResolvedValueOnce([[]]); // empty result
      await expect(
        authService.loginAdmin('nobody@kitchenpro.test', VALID_PASS)
      ).rejects.toThrow('No account found');
    });

    it('throws on incorrect password', async () => {
      const hashed = await bcrypt.hash(CORRECT_PASS, 10);
      pool.query.mockResolvedValueOnce([[
        { id: 1, password: hashed, role: 'admin', restaurant_id: 1, name: 'Admin' },
      ]]);
      await expect(
        authService.loginAdmin('admin@kitchenpro.test', WRONG_PASS)
      ).rejects.toThrow('Incorrect password');
    });

    it('returns token and user object on valid credentials', async () => {
      const hashed = await bcrypt.hash(VALID_PASS, 10);
      pool.query.mockResolvedValueOnce([[
        { id: 5, password: hashed, role: 'admin', restaurant_id: 5, name: 'Admin' },
      ]]);
      const result = await authService.loginAdmin('admin@kitchenpro.test', VALID_PASS);

      expect(result.success).toBe(true);
      expect(typeof result.token).toBe('string');
      expect(result.user).toMatchObject({ id: 5, role: 'admin', restaurantId: 5 });
    });
  });
});
