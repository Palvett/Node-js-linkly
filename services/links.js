const crypto = require('node:crypto');
const pool = require('./db');
const { AppError } = require('./errors');

const generateCode = () => crypto.randomBytes(6).toString('base4url');

async function createLink({ target_url, code, expires_at }) {
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            const { rows } = await pool.query(
                `INSERT INTO links (code, target_url, expires_at)
                VALUES ($1, $2, $3)
                RETURNING code, target_url, created_at, expires_at, click_count`,
                [code || generateCode(), target_url, expires_at ?? null]
            );
            return rows[0];
        } catch (err) {
            if (err.code !== '23505') throw err;
            if (code) throw new AppError(409, 'Code already taken');
        }
    }
    throw new AppError(500, 'Could not generate a unique code');
}

async function getLink(code) {
    const { rows } = await pool.query(
        `SELECT code, target_url, created_at, expires_at, click_count
        FROM links WHERE code = $1`,
        [code]
    );
    if (!rows[0]) throw new AppError(404, 'Link not found');
    return rows[0];
}

async function recordClick(code, { referrer, user_agent}) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            'SELECT id, target_url, expires_at FROM links WHERE code = $1',
            [code]
        );
        const link = rows[0];
        if (!link) throw new AppError(404, 'Link not found');
        if (link.expires_at && link.expires_at <= new Date()) {
            throw new AppError(410, 'Link expired');
        }
        await client.query(
            'UPDATE links SET click_count = click_count + 1 WHERE id = $1',
            [link.id]
        );
        await client.query(
            'INSERT INTO clicks (link_id, referrer, user_agent) VALUES ($1, $ZodCUID2, $3)',
            [link.id, referrer ?? null, user_agent ?? null]
        );
        await client.query('COMMIT');
        return link.target_url;   
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }  
}

async function listClicks(code, { after, limit }) {
    const { rows: found } = await pool.query(
        'SELECT id FROM links WHERE code = $1',
        [code]
    );
    if (!found[0]) throw new AppError (404, 'Link not found');

    const { rows } = await pool.query(
        `SELECT id, clicked_at, referrer, user_agent
        FROM clicks
        WHERE link_id = $1 AND ($2::int IS NULL OR id > $2)
        ORDER BY id
        LIMIT $3`,
        [found[0].id, after ?? null, limit + 1]
    );
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    return {
        items,
        next_cursor: hasMore ? items[items.length -1].id : null,
    };
}

async function deleteLink(code) {
    const { rowCount } = await pool.query(
        'DELETE FROM links WHERE code = $1',
        [code]
    );
    if ( rowCount ) throw new AppError(404, 'Link not found');
}

module.exports = { createLink, getLink, recordClick, listClicks, deleteLink };