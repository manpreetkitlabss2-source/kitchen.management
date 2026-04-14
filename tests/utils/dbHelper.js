const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../setup/.env.test') });

let pool;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 5,
    });
  }
  return pool;
};

const query = async (sql, params = []) => {
  const db = getPool();
  const [rows] = await db.query(sql, params);
  return rows;
};

const cleanTable = async (table) => query(`DELETE FROM ${table}`);

const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

module.exports = { getPool, query, cleanTable, closePool };
