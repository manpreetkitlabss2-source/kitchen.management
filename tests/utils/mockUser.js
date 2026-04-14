const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_only';

const mockAdminPayload = {
  userId: 1,
  role: 'admin',
  restaurantId: 1,
};

const mockManagerPayload = {
  userId: 2,
  role: 'manager',
  restaurantId: 1,
};

const mockChefPayload = {
  userId: 3,
  role: 'chef',
  restaurantId: 1,
};

const generateToken = (payload = mockAdminPayload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

const adminToken = () => generateToken(mockAdminPayload);
const managerToken = () => generateToken(mockManagerPayload);
const chefToken = () => generateToken(mockChefPayload);

module.exports = {
  mockAdminPayload,
  mockManagerPayload,
  mockChefPayload,
  generateToken,
  adminToken,
  managerToken,
  chefToken,
};
