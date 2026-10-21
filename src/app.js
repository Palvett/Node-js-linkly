const express = require('express');
const morgan = require('morgan');
const pool = require('./db');

const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'db_unavailable' });
  }
});

module.exports = app;