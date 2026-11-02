import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../../app.js';
import { pool } from '../../db/index.js';

let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://localhost:${server.address().port}`;
});

beforeEach(async () => {
  await pool.query('DELETE FROM links'); // clicks go too (ON DELETE CASCADE)
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('GET /health returns ok', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
});
