import { pool } from '../../db/index.js';

export async function getHealth(_req, res) {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'db_unavailable' });
  }
}
