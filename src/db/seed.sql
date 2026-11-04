INSERT INTO links (code, target_url, expires_at, click_count) VALUES
  ('mdn',  'https://developer.mozilla.org', NULL, 3),
  ('node', 'https://nodejs.org',            NULL, 0),
  ('old',  'https://example.com',           '2020-01-01T00:00:00Z', 0);

INSERT INTO clicks (link_id, referrer, user_agent)
SELECT l.id, 'https://google.com', 'seed-agent'
FROM links l, generate_series(1, 3)
WHERE l.code = 'mdn';