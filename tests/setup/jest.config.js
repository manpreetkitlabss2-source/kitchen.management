const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.test') });

module.exports = {
  rootDir: path.resolve(__dirname, '..'),
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/tests/backend/**/*.test.js',
        '<rootDir>/tests/database/**/*.test.js',
      ],
      setupFiles: ['<rootDir>/tests/setup/testSetup.js'],
      transform: { '^.+\\.js$': 'babel-jest' },
      testTimeout: 15000,
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: ['<rootDir>/tests/frontend/**/*.test.jsx'],
      setupFiles: ['<rootDir>/tests/setup/testSetup.js'],
      setupFilesAfterFramework: ['@testing-library/jest-dom'],
      transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
      moduleNameMapper: {
        '\\.(css|less|scss)$': '<rootDir>/tests/utils/__mocks__/styleMock.js',
      },
    },
  ],
  collectCoverageFrom: [
    'backend_mysql/src/**/*.js',
    'client/app/**/*.{js,jsx}',
    '!**/node_modules/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  verbose: true,
};
