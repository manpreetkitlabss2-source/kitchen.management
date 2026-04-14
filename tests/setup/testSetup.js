const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.test') });

// Silence console output during tests unless DEBUG=true
if (process.env.DEBUG !== 'true') {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
}
