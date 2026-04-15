const mysql = require('mysql2/promise');
const path  = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../setup/.env.test') });

let pool = null;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host            : process.env.DB_HOST     || 'localhost',
      user            : process.env.DB_USER     || 'root',
      password        : process.env.DB_PASSWORD || '',
      database        : process.env.DB_NAME     || 'kitchen_pro_test',
      port            : Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit : 5,
      queueLimit      : 0,
    });
  }
  return pool;
};

/**
 * Execute a raw SQL query against the test database.
 * @param {string}  sql
 * @param {Array}   params
 * @returns {Promise<Array>}
 */
const query = async (sql, params = []) => {
  const [rows] = await getPool().query(sql, params);
  return rows;
};

/**
 * Delete all rows from a table (use in afterAll/afterEach for cleanup).
 * @param {string} table
 */
const cleanTable = async (table) => query(`DELETE FROM \`${table}\``);

/**
 * Close the pool — call in afterAll of DB test suites.
 */
const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

module.exports = { getPool, query, cleanTable, closePool };
