const { ROLES, hasPermission } = require('../../../../backend_mysql/src/config/roles');

describe('RBAC - hasPermission', () => {
  it('admin has all permissions via wildcard', () => {
    expect(hasPermission('admin', 'inventory:read')).toBe(true);
    expect(hasPermission('admin', 'user:create')).toBe(true);
    expect(hasPermission('admin', 'batch:write')).toBe(true);
  });

  it('manager has expected permissions', () => {
    expect(hasPermission('manager', 'inventory:read')).toBe(true);
    expect(hasPermission('manager', 'inventory:write')).toBe(true);
    expect(hasPermission('manager', 'user:create')).toBe(true);
  });

  it('chef cannot write inventory', () => {
    expect(hasPermission('chef', 'inventory:write')).toBe(false);
  });

  it('chef can read recipes and create consumption', () => {
    expect(hasPermission('chef', 'recipe:read')).toBe(true);
    expect(hasPermission('chef', 'consumption:create')).toBe(true);
  });

  it('inventory_staff cannot create consumption', () => {
    expect(hasPermission('inventory_staff', 'consumption:create')).toBe(false);
  });

  it('inventory_staff can read and write inventory', () => {
    expect(hasPermission('inventory_staff', 'inventory:read')).toBe(true);
    expect(hasPermission('inventory_staff', 'inventory:write')).toBe(true);
  });

  it('unknown role returns false', () => {
    expect(hasPermission('ghost', 'inventory:read')).toBe(false);
  });

  it('ROLES object contains all four roles', () => {
    expect(Object.keys(ROLES)).toEqual(expect.arrayContaining(['admin', 'manager', 'chef', 'inventory_staff']));
  });
});
