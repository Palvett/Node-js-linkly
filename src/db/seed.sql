WITH inserted AS (
  INSERT INTO links (code, target_url, expires_at, click_count) VALUES
    ('mdn',  'https://developer.mozilla.org', NULL, 3),
    ('node', 'https://nodejs.org',            NULL, 0),
    ('old',  'https://example.com',           '2020-01-01T00:00:00Z', 0)
  ON CONFLICT (code) DO NOTHING
  RETURNING id, code
)
INSERT INTO clicks (link_id, referrer, user_agent)
SELECT i.id, 'https://google.com', 'seed-agent'
FROM inserted i, generate_series(1, 3)
WHERE i.code = 'mdn';