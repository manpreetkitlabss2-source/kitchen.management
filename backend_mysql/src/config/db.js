const mysql = require('mysql2/promise');
require('dotenv').config();

const useSsl = process.env.DB_SSL === 'true';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'management_system',
  port: Number(process.env.DB_PORT) || 25060,
  charset: 'utf8mb4',
  ...(useSsl ? {
    ssl: {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
    }
  } : {}),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
