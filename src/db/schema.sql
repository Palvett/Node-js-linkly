CREATE TABLE IF NOT EXISTS links (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR (16) UNIQUE NOT NULL,
    target_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    click_count INTEGER NOT NULL DEFAULT 0 CHECK (click_count >= 0)
);

CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP NOT NULL DEFAULT now(),
    referrer TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_clicks_link_clicked
ON clicks (link_id, clicked_at);

CREATE INDEX IF NOT EXISTS idx_clicks_link_id_id
ON clicks (link_id, id);

-- The below block of code is to convert any leftover TIMESTAMP columns to TIMESTAMPTZ(existing values are read as UTC).
-- Already TIMESTAPTZ columns are skipped, so this is safe to rerun.
DO $$
DECLARE
    col RECORD; -- one row per column that still needs converting.
BEGIN
    FOR col IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND (table_name, column_name) IN (
              ('links', 'created_at'),
              ('links', 'expires_at'),
              ('clicks', 'clicked_at')
          )
          AND data_type = 'timestamp without time zone'
    LOOP
        EXECUTE format(
            'ALTER TABLE %I ALTER COLUMN %I TYPE TIMESTAMPTZ USING %I AT TIME ZONE ''UTC''',
            col.table_name,
            col.column_name,
            col.column_name
        );
    END LOOP;
END $$;