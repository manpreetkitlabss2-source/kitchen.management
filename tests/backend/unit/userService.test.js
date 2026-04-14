const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../setup/.env.test') });

jest.mock('../../../../backend_mysql/src/config/db');

const pool = require('../../../../backend_mysql/src/config/db');
const { createUser, CREATABLE_ROLES } = require('../../../../backend_mysql/src/services/userService');

afterEach(() => jest.clearAllMocks());

describe('userService', () => {
  describe('CREATABLE_ROLES', () => {
    it('admin can create manager, chef, inventory_staff', () => {
      expect(CREATABLE_ROLES.admin).toEqual(expect.arrayContaining(['manager', 'chef', 'inventory_staff']));
    });

    it('manager cannot create admin', () => {
      expect(CREATABLE_ROLES.manager).not.toContain('admin');
    });
  });

  describe('createUser', () => {
    it('throws if creator not found', async () => {
      pool.query.mockResolvedValueOnce([[]]); // creator lookup
      await expect(createUser({ name: 'A', email: 'a@b.com', password: 'p', role: 'chef', createdBy: 99 }))
        .rejects.toThrow('invalid');
    });

    it('throws if creator role cannot assign the given role', async () => {
      pool.query.mockResolvedValueOnce([[{ role: 'chef', restaurant_id: 1 }]]); // creator is chef
      await expect(createUser({ name: 'A', email: 'a@b.com', password: 'p', role: 'manager', createdBy: 3 }))
        .rejects.toThrow('permission');
    });

    it('throws if email already exists', async () => {
      pool.query
        .mockResolvedValueOnce([[{ role: 'admin', restaurant_id: 1 }]])  // creator
        .mockResolvedValueOnce([[{ id: 5 }]]);                            // email exists
      await expect(createUser({ name: 'A', email: 'dup@b.com', password: 'p', role: 'chef', createdBy: 1 }))
        .rejects.toThrow('already exists');
    });

    it('creates user and returns data', async () => {
      pool.query
        .mockResolvedValueOnce([[{ role: 'admin', restaurant_id: 1 }]])  // creator
        .mockResolvedValueOnce([[]])                                       // no duplicate email
        .mockResolvedValueOnce([{ insertId: 10 }]);                       // INSERT
      const result = await createUser({ name: 'Bob', email: 'bob@test.com', password: 'pass', role: 'chef', createdBy: 1 });
      expect(result.id).toBe(10);
      expect(result.role).toBe('chef');
    });
  });
});
