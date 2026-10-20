require('dotenv').config();
const express = require ('express');
const logger = require ('morgan');
const pool = require ('./db');

const app = express();

app.use(logger('dev'));
app.use(express.json());

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok' });
    } catch {
        res.status(503).json({ status: 'db_unavailable'});
    }
});

module.exports = app;