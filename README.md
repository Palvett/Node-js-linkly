# Node-js-linkly

A URL shortener with click analytics. Express 5, PostgreSQL, Zod, `node:test`.

## Prerequisites

- Node.js 24 (see `.nvmrc`)
- PostgreSQL 16, or Docker with Compose

## Getting Started

```bash
git clone https://github.com/Palvett/Node-js-linkly.git
cd Node-js-linkly
```

## Run locally

1. Create two databases, `linkly` and `linkly_test`.
2. Create `.env.development` (and `.env.test` for tests):

   ```ini
   DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/linkly
   PORT=3000
   ```

   _Note: for `.env.test`, point the database name in `DATABASE_URL` at `linkly_test` instead of `linkly`._

3. Install, migrate and start:

   ```bash
   npm ci
   npm run db:migrate
   npm start
   ```

## Run with Docker

```bash
docker compose up --build
```

Starts a seeded Postgres and the app on `http://localhost:3000`. All config comes from environment variables (`DATABASE_URL`, `PORT`). Stop any local server on port 3000 first, or set `APP_PORT=3100`. Reset the data with `docker compose down -v`.

## Scripts

| Script                    | What it does                             |
| ------------------------- | ---------------------------------------- |
| `npm start`               | Start the server                         |
| `npm run db:migrate`      | Apply `schema.sql` to the dev database   |
| `npm run db:migrate:test` | Apply `schema.sql` to the test database  |
| `npm test`                | Migrate the test database, run the tests |
| `npm run lint`            | ESLint                                   |
| `npm run format:check`    | Prettier check                           |

## Endpoints

Interactive docs: `http://localhost:3000/docs` (Swagger UI).

| Method | Path                      | Success | Errors        |
| ------ | ------------------------- | ------- | ------------- |
| POST   | `/links`                  | 201     | 400, 409      |
| GET    | `/:code`                  | 302     | 400, 404, 410 |
| GET    | `/links/:code`            | 200     | 400, 404      |
| GET    | `/links/:code/clicks`     | 200     | 400, 404      |
| GET    | `/links/:code/clicks.csv` | 200     | 400, 404      |
| DELETE | `/links/:code`            | 204     | 400, 404      |
| GET    | `/health`                 | 200     | 503           |

`GET /links/:code/clicks?after=&limit=` uses keyset pagination. The response is `{ items, next_cursor }`, and `next_cursor` is `null` on the last page.

## Design notes

- **Atomic counter:** a redirect runs `UPDATE links SET click_count = click_count + 1` and `INSERT INTO clicks` in one transaction.
- **Validation:** Zod at the boundary. Controllers read the parsed output from `req.validated`, never the raw request.
- **SQL:** parameterized queries only.
- **Indexed lookup:** `WHERE code = $1` uses the unique index.

```text
Index Scan using links_code_key on links  (cost=0.29..8.30 rows=1 width=37)
  Index Cond: ((code)::text = 'bulk15000'::text)
```

## Tests

`npm test` runs against a disposable `linkly_test` database. It covers the endpoint contract, the atomic counter under 50 concurrent clicks, and a SQL injection regression. The `after` hook closes the server and the pool.
