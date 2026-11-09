import { readFileSync } from 'node:fs';
import { pool } from './index.js';
import { logger } from '../middlewares/logger.js';

try {
  const sql = readFileSync(new URL('./seed.sql', import.meta.url), 'utf8');
  await pool.query(sql);
  logger.info('Seed complete');
} catch (err) {
  logger.error({ err }, 'Seed failed');
  process.exitCode = 1;
} finally {
  await pool.end();
}
