const path = require('path');

module.exports = async () => {
  try {
    const pool = require(path.resolve(__dirname, '../utils/testDb.js'));
    if (pool && typeof pool.end === 'function') await pool.end();
  } catch (_) {}
};
