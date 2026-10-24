# Optional backend operations

## Development

1. Install Node 24 LTS.
2. Run `npm ci`.
3. Run `npm run dev:full`.
4. Open http://localhost:4173 and create a new account.
5. Add an address, add products to the bag, and check out with the demo card or simulated wallet credit.

The frontend proxies `/api` to http://127.0.0.1:4000. Keep the frontend origin at http://localhost:4173 unless you change `APP_ORIGIN`. `npm run dev:full` forces API mode, overriding `VITE_DATA_MODE` in the child process environment. No data is shared with the browser-only demo.

## Environment

Copy `.env.example` to `.env` only when customization is needed.

| Variable         | Default / use                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `PORT`           | 4000                                                                                       |
| `APP_ORIGIN`     | `http://localhost:4173`; exact browser origin for mutation protection                      |
| `DATABASE_PATH`  | Absolute or working-directory-relative SQLite path; default `server/data/solehaven.sqlite` |
| `NODE_ENV`       | Set `production` behind HTTPS to enable Secure cookies and HSTS                            |
| `VITE_API_URL`   | `/api`; used only by an API-mode frontend build                                            |
| `VITE_DATA_MODE` | Demo when absent; `dev:full`, `build`, and `build:api` explicitly choose their modes       |

Node process scripts read `.env` using `--env-file-if-exists`. Vite also reads its standard environment files. Never place server secrets in a `VITE_` variable; those variables are bundled into the client.

## Single-server deployment

Use a long-running Node server with durable disk and HTTPS termination. The API and SPA share one origin, avoiding third-party cookie and CORS problems.

```bash
npm ci
npm run build:api
npm prune --omit=dev
npm start
```

Set `NODE_ENV=production`, `APP_ORIGIN=https://your-actual-domain`, `PORT`, and a durable `DATABASE_PATH` in the host environment. The `dist` directory must be present. Your reverse proxy should forward both frontend and `/api` requests to this server.

For local HTTP testing of the built API mode, leave `NODE_ENV` unset and use `.env` with `APP_ORIGIN=http://localhost:4000`. Build with `npm run build:api`, run `npm start`, and open that exact URL.

This SQLite implementation uses synchronous transactions in one Node process and is suitable for a local/full-stack demonstration. It is not a horizontally scaled marketplace backend. Add an external database and distributed rate limiting before scaling to multiple API instances.

## Order fulfillment

Only the server operator with access to the database can advance an API order:

```bash
node --env-file-if-exists=.env server/manage.mjs order-status SH-REPLACE_WITH_ORDER_ID processing
node --env-file-if-exists=.env server/manage.mjs order-status SH-REPLACE_WITH_ORDER_ID shipped
node --env-file-if-exists=.env server/manage.mjs order-status SH-REPLACE_WITH_ORDER_ID out_for_delivery
node --env-file-if-exists=.env server/manage.mjs order-status SH-REPLACE_WITH_ORDER_ID delivered
```

Advance one step at a time. Cancelled orders cannot advance. The command records history and a customer notification. Customers use **Refresh order status** on the order page to retrieve the latest state. No carrier is contacted.

## Catalog and data

A new SQLite database seeds products from `shared/catalog.mjs` using `INSERT OR IGNORE`. Existing records retain their stock and data. Editing the source affects frontend demo data and new databases, not an existing live database. For a disposable local database, stop the server and back up `server/data` before resetting it. Do not delete a database containing orders you need.

Tables: `users`, `sessions`, `customer_state`, `products`, `orders`. Customer state stores a JSON aggregate for addresses/cart/wallet/preferences; orders also have an indexed record for fulfillment lookup. Updates are transactional. IDs are random, and all customer actions use the authenticated session identity.

For a consistent backup, stop the server and copy the database and any SQLite `-wal` / `-shm` sidecars together, or use SQLite's supported backup API. Protect backups like account data.

## Vercel + external API (optional future deployment)

The default included Vercel configuration serves a standalone demo. To use a separately hosted API, build with `npm run build:api` and configure a same-origin `/api/:path*` reverse proxy before the SPA catch-all rewrite. The API must allow the exact frontend `APP_ORIGIN` and use HTTPS. Do not simply point to a cross-site URL and assume cookies/CORS will work; this project intentionally expects same-origin routing. The existing Vercel demo needs none of these changes.
