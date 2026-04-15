const { ROLES, hasPermission } = require('@backend/config/roles');

describe('Unit — RBAC hasPermission', () => {

  // ── Admin ─────────────────────────────────────────────────────────────────
  describe('admin role', () => {
    it('has wildcard — grants every permission', () => {
      const allPerms = [
        'inventory:read',    'inventory:write',
        'recipe:read',       'recipe:write',
        'consumption:read',  'consumption:create',
        'waste:read',        'waste:create',
        'notification:read', 'notification:write',
        'user:create',
        'batch:read',        'batch:write',
        'order:read',        'order:create',
        'dashboard:read',
      ];
      allPerms.forEach(p => expect(hasPermission('admin', p)).toBe(true));
    });
  });

  // ── Manager ───────────────────────────────────────────────────────────────
  describe('manager role', () => {
    it('can read and write inventory', () => {
      expect(hasPermission('manager', 'inventory:read')).toBe(true);
      expect(hasPermission('manager', 'inventory:write')).toBe(true);
    });

    it('can create users', () => {
      expect(hasPermission('manager', 'user:create')).toBe(true);
    });

    it('can read dashboard', () => {
      expect(hasPermission('manager', 'dashboard:read')).toBe(true);
    });
  });

  // ── Chef ──────────────────────────────────────────────────────────────────
  describe('chef role', () => {
    it('can read recipes and create consumption', () => {
      expect(hasPermission('chef', 'recipe:read')).toBe(true);
      expect(hasPermission('chef', 'consumption:create')).toBe(true);
    });

    it('cannot write inventory', () => {
      expect(hasPermission('chef', 'inventory:write')).toBe(false);
    });

    it('cannot create users', () => {
      expect(hasPermission('chef', 'user:create')).toBe(false);
    });

    it('cannot read dashboard', () => {
      expect(hasPermission('chef', 'dashboard:read')).toBe(false);
    });
  });

  // ── Inventory Staff ───────────────────────────────────────────────────────
  describe('inventory_staff role', () => {
    it('can read and write inventory', () => {
      expect(hasPermission('inventory_staff', 'inventory:read')).toBe(true);
      expect(hasPermission('inventory_staff', 'inventory:write')).toBe(true);
    });

    it('cannot create consumption', () => {
      expect(hasPermission('inventory_staff', 'consumption:create')).toBe(false);
    });

    it('cannot create users', () => {
      expect(hasPermission('inventory_staff', 'user:create')).toBe(false);
    });

    it('cannot write batches', () => {
      expect(hasPermission('inventory_staff', 'batch:write')).toBe(false);
    });
  });

  // ── Unknown / edge-case roles ─────────────────────────────────────────────
  describe('unknown role', () => {
    it('returns false for unrecognised role string', () => {
      expect(hasPermission('ghost', 'inventory:read')).toBe(false);
    });

    it('returns false for undefined role', () => {
      expect(hasPermission(undefined, 'inventory:read')).toBe(false);
    });

    it('returns false for empty string role', () => {
      expect(hasPermission('', 'inventory:read')).toBe(false);
    });
  });

  // ── ROLES map ─────────────────────────────────────────────────────────────
  describe('ROLES map structure', () => {
    it('contains exactly the four expected roles', () => {
      expect(Object.keys(ROLES)).toEqual(
        expect.arrayContaining(['admin', 'manager', 'chef', 'inventory_staff'])
      );
    });

    it('admin entry uses wildcard', () => {
      expect(ROLES.admin).toContain('*');
    });
  });
});
