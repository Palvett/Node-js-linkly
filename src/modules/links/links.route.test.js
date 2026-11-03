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

test('Get /:code redirects (302) and count the click', async () => {
  const res = await fetch(`${base}/a1b`, { redirect: 'manual' });
  assert.equal(res.headers.get('location'), 'https://example.com');
  const link = await (await fetch(`${base}/links/a1b`)).json();
  assert.equal(link.click_count, 1);
});

test('GET /:code returns 404 for an unknown code', async () => {
  assert.equal((await fetch(`${base}/nope`, { redirect: 'manual' })).status, 404);
});

test('GET /:code returns 410 for an expired link and does not count it', async () => {
  await pool.query(`INSERT INTO links (code, target_url, expires_at) VALUES ('old', 'https://example.com', '2020-01-01T00:00:00Z')`);
  assert.equal((await fetch(`${base}/old`, { redirect: 'manual' })).status, 410);
  const { rows } = await pool.query(`SELECT click_count FROM links WHERE code = 'old'`);
  assert.equal(rows[0].click_count, 0);
});

test('GET /links/:code/clicks is keyset-paginated', async () => {
  for (let i = 0; i < 3; i++) await fetch(`${base}/a1b`, { redirect: 'manual' });

  const page1 = await (await fetch(`${base}/links/a1b/clicks?limit=2`)).json();
  assert.equal(page1.items.length, 2);
  assert.ok(page1.next_cursor);

  const page2 = await (await fetch(`${base}/links/a1b/clicks?limit=2&after=${page1.next_cursor}`)).json();
  assert.equal(page2.items.length, 1);
  assert.equal(page2.next_cursor, null);
});

test('GET /links/:code/clicks returns 404 for an unknown code', async () => {
  assert.equal((await fetch(`${base}/links/nope/clicks`)).status, 404);
});

test('GET /links/:code/clicks.csv streams a CSV', async () => {
  await fetch(`${base}/a1b`, { redirect: 'manual' });
  const res = await fetch(`${base}/links/a1b/clicks.csv`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/csv');
  const lines = (await res.text()).trim().split('\n');
  assert.equal(lines[0], 'id,clicked_at,referrer,user_agent');
  assert.equal(lines.length, 2);
});

test('DELETE /links/:code removes the link and its clicks', async () => {
  await fetch(`${base}/a1b`, { redirect: 'manual' });
  assert.equal((await fetch(`${base}/links/a1b`, { method: 'DELETE' })).status, 204);
  assert.equal((await fetch(`${base}/links/a1b`)).status, 404);
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM clicks');
  assert.equal(rows[0].n, 0);
});

test('DELETE /links/:code returns 404 for an unknown code', async () => {
  assert.equal((await fetch(`${base}/links/nope`, { method: 'DELETE' })).status, 404);
});

test('click counter is atomic under concurrency', async () => {
  const N = 50;
  const responses = await Promise.all(Array.from({ length: N }, () => fetch(`${base}/a1b`, { redirect: 'manual' })));
  assert.ok(responses.every((r) => r.status === 302));

  const { rows } = await pool.query(
    `SELECT l.click_count,
            (SELECT count(*)::int FROM clicks WHERE link_id = l.id) AS logged
     FROM links l WHERE l.code = 'a1b'`,
  );
  assert.equal(rows[0].click_count, N);
  assert.equal(rows[0].logged, N);
});

test('SQL injection attempts stay harmless', async () => {
  const evilUrl = "https://example.com/?x=1';DROP%20TABLE%20links;--";
  const evilAgent = "'); DROP TABLE clicks; --";

  // 1. Injection in the body is stored as plain text
  const created = await post({ target_url: evilUrl, code: 'evil1' });
  assert.equal(created.status, 201);

  // 2. Injection in the path is rejected by Zod before it reaches SQL
  const path = encodeURIComponent("a1b' OR '1'='1");
  assert.equal((await fetch(`${base}/links/${path}`)).status, 400);

  // 3. Injection in a header is stored as plain text
  await fetch(`${base}/a1b`, { redirect: 'manual', headers: { 'User-Agent': evilAgent } });

  // Both values came back verbatim or word for word exactly as it was written
  const link = await pool.query('SELECT target_url FROM links WHERE code = $1', ['evil1']);
  assert.equal(link.rows[0].target_url, evilUrl);
  const click = await pool.query('SELECT user_agent FROM clicks');
  assert.equal(click.rows[0].user_agent, evilAgent);

  // And both tables still exist
  const t = await pool.query(`SELECT to_regclass('public.links') AS l, to_regclass('public.clicks') AS c`);
  assert.ok(t.rows[0].l && t.rows[0].c);
});
