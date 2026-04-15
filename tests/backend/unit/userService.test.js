jest.mock('@backend/config/db');

const pool = require('@backend/config/db');
const { createUser, getUsers, CREATABLE_ROLES } = require('@backend/services/userService');

// Use env-sourced values — never hardcode credentials in test files
const TEST_PASS  = process.env.TEST_VALID_PASS || 'valid_pass_env';
const TEST_EMAIL = 'unit_test_user@kitchenpro.test';
const DUP_EMAIL  = 'unit_test_dup@kitchenpro.test';

afterEach(() => jest.clearAllMocks());

describe('Unit — userService', () => {

  // ── CREATABLE_ROLES constant ──────────────────────────────────────────────
  describe('CREATABLE_ROLES', () => {
    it('admin can create manager, chef, inventory_staff', () => {
      expect(CREATABLE_ROLES.admin).toEqual(
        expect.arrayContaining(['manager', 'chef', 'inventory_staff'])
      );
    });

    it('manager can create chef and inventory_staff', () => {
      expect(CREATABLE_ROLES.manager).toEqual(
        expect.arrayContaining(['chef', 'inventory_staff'])
      );
    });

    it('manager cannot create admin or manager', () => {
      expect(CREATABLE_ROLES.manager).not.toContain('admin');
      expect(CREATABLE_ROLES.manager).not.toContain('manager');
    });

    it('chef and inventory_staff have no creatable roles', () => {
      expect(CREATABLE_ROLES.chef).toBeUndefined();
      expect(CREATABLE_ROLES.inventory_staff).toBeUndefined();
    });
  });

  // ── createUser ────────────────────────────────────────────────────────────
  describe('createUser', () => {
    it('throws "invalid" when creator session is not found', async () => {
      pool.query.mockResolvedValueOnce([[]]); // creator not found
      await expect(
        createUser({ name: 'Test', email: TEST_EMAIL, password: TEST_PASS, role: 'chef', createdBy: 99 })
      ).rejects.toThrow('invalid');
    });

    it('throws "permission" when creator role cannot assign the given role', async () => {
      pool.query.mockResolvedValueOnce([[{ role: 'chef', restaurant_id: 1 }]]);
      await expect(
        createUser({ name: 'Test', email: TEST_EMAIL, password: TEST_PASS, role: 'manager', createdBy: 3 })
      ).rejects.toThrow('permission');
    });

    it('throws "already exists" when email is taken', async () => {
      pool.query
        .mockResolvedValueOnce([[{ role: 'admin', restaurant_id: 1 }]]) // creator
        .mockResolvedValueOnce([[{ id: 5 }]]);                           // email exists
      await expect(
        createUser({ name: 'Test', email: DUP_EMAIL, password: TEST_PASS, role: 'chef', createdBy: 1 })
      ).rejects.toThrow('already exists');
    });

    it('creates user and returns id, role, restaurant_id', async () => {
      pool.query
        .mockResolvedValueOnce([[{ role: 'admin', restaurant_id: 1 }]]) // creator
        .mockResolvedValueOnce([[]])                                      // no duplicate
        .mockResolvedValueOnce([{ insertId: 10 }]);                      // INSERT

      const result = await createUser({
        name: 'New Chef', email: TEST_EMAIL, password: TEST_PASS, role: 'chef', createdBy: 1,
      });
      expect(result.id).toBe(10);
      expect(result.role).toBe('chef');
      expect(result.restaurant_id).toBe(1);
    });
  });

  // ── getUsers ──────────────────────────────────────────────────────────────
  describe('getUsers', () => {
    it('returns rows for admin using recursive CTE', async () => {
      pool.query.mockResolvedValueOnce([[
        { id: 2, name: 'Chef A', email: 'chef_a@kitchenpro.test', role: 'chef', created_by: 1 },
      ]]);
      const rows = await getUsers({ createdBy: 1, creatorRole: 'admin' });
      expect(rows).toHaveLength(1);
      expect(rows[0].role).toBe('chef');
    });

    it('returns direct children only for manager', async () => {
      pool.query.mockResolvedValueOnce([[
        { id: 3, name: 'Staff A', email: 'staff_a@kitchenpro.test', role: 'inventory_staff', created_by: 2 },
      ]]);
      const rows = await getUsers({ createdBy: 2, creatorRole: 'manager' });
      expect(rows).toHaveLength(1);
      expect(rows[0].role).toBe('inventory_staff');
    });
  });
});
