import { readFileSync } from 'node:fs';
import { pool } from './index.js';
import { logger } from '../utils/logger.js';

try {
  const sql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(sql);
  logger.info('Migration complete');
} catch (err) {
  logger.error({ err }, 'Migration failed');
  process.exitCode = 1;
} finally {
  await pool.end();
}
