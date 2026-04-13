// Mirrors backend_mysql/src/config/roles.js exactly.
// Keep in sync if backend permissions change.

const ROLE_KEY = 'user_role';

const ROLES = {
  admin:           ['*'],
  manager:         ['dashboard:read', 'inventory:read', 'inventory:write', 'recipe:read', 'recipe:write', 'consumption:read', 'consumption:create', 'waste:read', 'waste:create', 'notification:read', 'notification:write', 'user:create', 'batch:read', 'batch:write', 'order:read', 'order:create'],
  chef:            ['recipe:read', 'consumption:read', 'consumption:create', 'inventory:read', 'batch:read', 'batch:write', 'order:read', 'order:create'],
  inventory_staff: ['inventory:read', 'inventory:write', 'waste:read', 'waste:create', 'notification:read', 'batch:read'],
};

export function saveRole(role) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROLE_KEY, role);
}

export function getRole() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ROLE_KEY);
}

export function removeRole() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ROLE_KEY);
}

/**
 * Check if the currently logged-in user has a given permission.
 * @param {string} permission
 * @returns {boolean}
 */
export function can(permission) {
  const role = getRole();
  if (!role) return false;
  const perms = ROLES[role];
  if (!perms) return false;
  return perms.includes('*') || perms.includes(permission);
}

/**
 * Check permission for an explicit role (useful in components that receive role as prop).
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const perms = ROLES[role];
  if (!perms) return false;
  return perms.includes('*') || perms.includes(permission);
}

export { ROLES };
