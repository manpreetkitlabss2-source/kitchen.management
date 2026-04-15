const jwt = require('jsonwebtoken');

// JWT_SECRET must come from .env.test — no hardcoded fallback
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('[mockUser] JWT_SECRET is not set. Ensure tests/setup/.env.test is loaded.');
}

const PAYLOADS = {
  admin          : { userId: 1, role: 'admin',           restaurantId: 1 },
  manager        : { userId: 2, role: 'manager',         restaurantId: 1 },
  chef           : { userId: 3, role: 'chef',            restaurantId: 1 },
  inventory_staff: { userId: 4, role: 'inventory_staff', restaurantId: 1 },
};

/**
 * Generate a signed JWT for a given role payload.
 * @param {object} payload
 * @returns {string}
 */
const generateToken = (payload = PAYLOADS.admin) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

const adminToken          = () => generateToken(PAYLOADS.admin);
const managerToken        = () => generateToken(PAYLOADS.manager);
const chefToken           = () => generateToken(PAYLOADS.chef);
const inventoryStaffToken = () => generateToken(PAYLOADS.inventory_staff);

/**
 * Returns an Authorization header object for supertest.
 * @param {string} token
 */
const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = {
  PAYLOADS,
  generateToken,
  adminToken,
  managerToken,
  chefToken,
  inventoryStaffToken,
  authHeader,
};
