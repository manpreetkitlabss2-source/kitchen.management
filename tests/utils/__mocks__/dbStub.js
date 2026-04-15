/**
 * Silent DB stub for unit tests.
 * jest.mock('@backend/config/db') auto-mocks this file — all methods become jest.fn().
 * No real MySQL connection is ever attempted.
 */
const stub = {
  query        : jest.fn(),
  getConnection: jest.fn(),
  end          : jest.fn().mockResolvedValue(undefined),
};

module.exports = stub;
