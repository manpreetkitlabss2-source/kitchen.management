/**
 * Test-environment database pool.
 * Used by API and integration tests via moduleNameMapper override.
 * Reads from tests/setup/.env.test — never touches the production DB.
 */
const mysql = require('mysql2/promise');
const path  = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../../tests/setup/.env.test') });

const pool = mysql.createPool({
  host              : process.env.DB_HOST     || 'localhost',
  user              : process.env.DB_USER     || 'root',
  password          : process.env.DB_PASSWORD || '',
  database          : process.env.DB_NAME     || 'defaultdb',
  port              : Number(process.env.DB_PORT) || 16475,
  charset           : 'utf8mb4',
  ssl               : { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit   : 5,
  queueLimit        : 0,
});

module.exports = pool;
