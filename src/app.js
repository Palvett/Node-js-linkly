import express from 'express';
import morgan from 'morgan';
import { pool } from './db/index.js';

export const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'db_unavailable' });
  }
});
