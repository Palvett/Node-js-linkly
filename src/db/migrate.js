const fs = require('node:fs');
const path = require('node:path');
const pool = require('./index');
const logger = require('../utils/logger');

(async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    logger.info('Migration complete');
  } catch (err) {
    logger.error({ err }, 'Migration failed');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
