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
  await pool.query('DELETE FROM links');
  await pool.query(
    `INSERT INTO links (code, target_url) VALUES
    ('a1b', 'https://example.com'),
    ('c2b', 'https://nodejs.org')`,
  );
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

const post = (body) =>
  fetch(`${base}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

test('POST /links creates a link (201)', async () => {
  const res = await post({ target_url: 'https://example.org', code: 'newcode' });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.code, 'newcode');
  assert.equal(body.click_count, 0);
});

test('POST /links without a code generates one (201)', async () => {
  const res = await post({ target_url: 'https://example.org' });
  assert.equal(res.status, 201);
  assert.match((await res.json()).code, /^[A-Za-z0-9_-]{3,16}$/);
});

test('POST /links rejects an invalid URL (400)', async () => {
  assert.equal((await post({ target_url: 'not-a-url' })).status, 400);
});

test('POST /links rejects a non-http URL (400)', async () => {
  assert.equal((await post({ target_url: 'javascript:alert(1)' })).status, 400);
});

test('POST /links rejects a bad code (400)', async () => {
  assert.equal((await post({ target_url: 'https://example.org', code: 'a!' })).status, 400);
});

test('POST /links rejects a taken code (409)', async () => {
  const res = await post({ target_url: 'https://example.org', code: 'a1b' });
  assert.equal(res.status, 409);
});
