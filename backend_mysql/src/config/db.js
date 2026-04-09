const mysql = require('mysql2/promise'); // Use the promise version
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'management_system',
  port: process.env.DB_PORT || 25060,
  ssl: {
    rejectUnauthorized: false // This ignores certificate errors
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('MySQL Connected via cloud db');
    connection.release();
  })
  .catch(err => console.log('MySQL Connection Error:', err));

module.exports = pool;

