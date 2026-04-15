const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env.test') });

const ROOT      = path.resolve(__dirname, '..');    // tests/
const PROJ_ROOT = path.resolve(__dirname, '../..'); // management-system/
const BACKEND   = path.resolve(PROJ_ROOT, 'backend_mysql/src');
const CLIENT    = path.resolve(PROJ_ROOT, 'client');
const DB_STUB   = path.resolve(ROOT, 'utils/__mocks__/dbStub.js');
const RESOLVER  = path.resolve(__dirname, 'resolver.js');

const unitMapper = {
  '^@backend/config/db$'   : DB_STUB,
  '^\.{1,2}/.*config/db$'  : DB_STUB,
  '\\.(css|less|scss)$'    : path.resolve(ROOT, 'utils/__mocks__/styleMock.js'),
};

const frontendMapper = {
  '\\.(css|less|scss)$': path.resolve(ROOT, 'utils/__mocks__/styleMock.js'),
};

module.exports = {
  rootDir          : ROOT,
  testTimeout      : 15000,
  verbose          : true,
  detectOpenHandles: true,
  globalTeardown   : path.resolve(__dirname, 'globalTeardown.js'),
  coverageDirectory: path.resolve(ROOT, 'coverage'),
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    `${BACKEND}/**/*.js`,
    `${CLIENT}/app/**/*.{js,jsx}`,
    '!**/node_modules/**',
    '!**/config/tables.js',
    '!**/config/migrations/**',
  ],

  projects: [
    {
      displayName           : 'unit',
      rootDir               : ROOT,
      testEnvironment       : 'node',
      testMatch             : ['<rootDir>/backend/unit/**/*.test.js'],
      setupFilesAfterEnv    : [path.resolve(__dirname, 'testSetup.js')],
      transform             : { '^.+\\.js$': 'babel-jest' },
      moduleNameMapper      : unitMapper,
      modulePaths           : [BACKEND, CLIENT],
      resolver              : RESOLVER,
      testPathIgnorePatterns: ['<rootDir>/node_modules/'],
    },

    {
      displayName           : 'frontend',
      rootDir               : ROOT,
      testEnvironment       : 'jest-environment-jsdom',
      testMatch             : ['<rootDir>/frontend/**/*.test.jsx'],
      setupFilesAfterEnv    : [
        path.resolve(__dirname, 'testSetup.js'),
        '@testing-library/jest-dom',
      ],
      transform             : { '^.+\\.[jt]sx?$': 'babel-jest' },
      transformIgnorePatterns: [
        '/node_modules/(?!(react-router|@remix-run|@react-router)/)',
      ],
      moduleNameMapper      : frontendMapper,
      modulePaths           : [BACKEND, CLIENT, path.resolve(CLIENT, 'node_modules')],
      resolver              : RESOLVER,
      testPathIgnorePatterns: ['<rootDir>/node_modules/'],
    },
  ],
};
