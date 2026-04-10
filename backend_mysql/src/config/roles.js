// Static role → permissions map.
// '*' means all permissions granted (admin only).
// All permission checks go through this single source of truth.

const ROLES = {
  admin:           ['*'],
  manager:         ['dashboard:read', 'inventory:read', 'inventory:write', 'recipe:read', 'recipe:write', 'consumption:read', 'consumption:create', 'waste:read', 'waste:create', 'notification:read', 'notification:write', 'user:create', 'batch:read', 'batch:write'],
  chef:            ['recipe:read', 'consumption:read', 'consumption:create', 'inventory:read', 'batch:read', 'batch:write'],
  inventory_staff: ['inventory:read', 'inventory:write', 'waste:read', 'waste:create', 'notification:read', 'batch:read'],

};

/**
 * Check if a role has a given permission.
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
function hasPermission(role, permission) {
  const perms = ROLES[role];
  if (!perms) return false;
  return perms.includes('*') || perms.includes(permission);
}

module.exports = { ROLES, hasPermission };
