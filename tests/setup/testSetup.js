const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env.test') });

// Guard: never run against production DB
if (process.env.NODE_ENV !== 'test') {
  throw new Error('[TEST GUARD] NODE_ENV must be "test". Refusing to run.');
}

// Polyfill TextEncoder/TextDecoder for jsdom environment (needed by react-router v7)
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Suppress console noise unless DEBUG=true
if (process.env.DEBUG !== 'true') {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
}

jest.setTimeout(15000);

