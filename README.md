# Solehaven — Full-stack sneaker store

A complete React + TypeScript shopping application inspired by the uploaded orange-and-white shoe-store interface. Responsive desktop and mobile layouts, local product photography, and a separate Node.js + SQLite API are included.

**Your Vercel demo needs no backend, database, account, API key, or environment variables.** `npm run build` explicitly builds **demo mode**, even if a local environment variable previously selected API mode.

All payments, wallet credit, delivery estimates, ratings, and products are illustrative. This is a working software showcase, not a live retailer or payment processor.

## Quick start

Install **Node.js 24 LTS** (minimum 22.13), extract the ZIP, and open a terminal inside the `solehaven` folder containing `package.json`:

```bash
npm ci
npm run dev
```

Open **http://localhost:4173**. Demo data is created automatically. No sign-in is required. Use **Account → Personalize demo** to change the sample name/email.

On Windows, double-click `setup-windows.bat`, then `start-demo.bat`. Extract first; do not run directly inside the ZIP. Internet is needed for the initial dependency installation. Images and fonts are bundled locally and never loaded from a third-party image/font host at runtime.

## Deploy the frontend demo to Vercel

1. Upload the extracted **contents of `solehaven/`** to a GitHub repository.
2. In Vercel, import that repository.
3. Set the **Root Directory** to the folder containing `package.json` and `vercel.json`. Use `.` if these files are at repository root, or `solehaven` if you committed the outer folder.
4. Use the following settings (the included `vercel.json` already supplies them):

| Setting               | Value           |
| --------------------- | --------------- |
| Framework preset      | Vite            |
| Node.js version       | 24.x            |
| Install command       | `npm ci`        |
| Build command         | `npm run build` |
| Output directory      | `dist`          |
| Environment variables | None needed     |

5. Deploy. Open the resulting Vercel URL, add a shoe, choose a size, and place a demo order.

The SPA rewrite handles refreshing `/product/1`, `/checkout`, `/orders`, and other routes. There is no need to deploy `server/` for this mode. Do not set the output folder to `src`, `public`, or `build`.

The included `dist/` is a prebuilt demo for convenience. Vercel should still run the source build above. For a local production preview:

```bash
npm run build
npm run preview
```

Use an HTTP server; do not double-click `dist/index.html` via `file://`.

## What works

- Responsive homepage, brand/category links, promotions, and product cards.
- Search, category/brand/gender/size/price/rating filters, and sorting.
- Product detail, enlarged photo, size guide, size selection, quantity, and quick-add dialog.
- Wishlist, shopping bag, quantity changes, removal, and save-for-later.
- Address create/edit/delete/default selection, with validation.
- Three-step checkout: delivery → payment → review.
- Promo codes: `WELCOME10`, `STEP20`, `FREESHIP`.
- Demo card, demo wallet, and simulated cash-on-delivery choices.
- Order confirmation, history, tracking timeline, cancellation, refunds of demo wallet credit, and downloadable text receipts.
- Demo tracking advancement and one review per delivered order.
- Demo wallet top-ups, debits, refunds, and transaction history.
- Editable profile, notification preferences, inbox, and reset-demo control.
- API mode: registration/login/logout, hashed passwords, password changes, session cookies, customer-owned records, server-side price/stock validation, and SQLite persistence.
- Error/empty states, keyboard focus, modal focus trapping, labels, reduced motion support, and a mobile bottom navigation bar.

## Two data modes

|                                                 | Default demo                      | Optional API mode                    |
| ----------------------------------------------- | --------------------------------- | ------------------------------------ |
| Storage                                         | `localStorage` in this browser    | SQLite on the backend                |
| Authentication                                  | One editable sample profile       | Registered server-side accounts      |
| Internet/backend dependency while using the app | No backend requests               | `/api` must be reachable             |
| Sample orders                                   | Two illustrative orders           | New accounts start empty             |
| Wallet                                          | Starts with $325 simulated credit | Starts at $0; demo top-ups supported |
| Tracking                                        | Shopper can simulate each step    | Store operator updates via CLI       |
| Payments                                        | Simulated                         | Simulated                            |
| Cross-device data                               | No                                | Yes, through the same backend        |

Demo and API data are deliberately separate. Switching modes does not migrate a cart, account, or order. API errors are shown explicitly; API mode does not silently switch to demo.

## Run the full stack locally

```bash
npm ci
npm run dev:full
```

Open **http://localhost:4173**. The command starts the Vite frontend in API mode and the backend on port 4000, with a same-origin Vite proxy. Register an account using the account/sign-in page. There are no seeded passwords or admin accounts. Use at least 10 characters for passwords. Create an address before checkout.

Windows shortcut: `start-fullstack.bat`.

The database is created at `server/data/solehaven.sqlite`. Keep this directory when restarting. Node's built-in SQLite needs no database installer, C++ compiler, or native npm SQLite package. Some supported Node versions print an experimental SQLite warning; it does not prevent startup.

To serve an API-connected production build from the Node server locally:

```bash
npm run build:api
npm start
```

Create `.env` with `APP_ORIGIN=http://localhost:4000` for that single-server local URL, then open **http://localhost:4000**. Set `NODE_ENV=production` only behind HTTPS; production session cookies are Secure. See [docs/BACKEND.md](docs/BACKEND.md) for deployment and operator commands.

**Do not put the SQLite backend on Vercel's ephemeral filesystem.** The requested Vercel setup is frontend-only. Host the optional backend on a long-running Node server with durable disk storage, or adapt persistence to a hosted database. For a same-origin full-stack demo, the Node server can serve the API build and API together.

## Commands

| Command             | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `npm run dev`       | Local frontend; demo unless `VITE_DATA_MODE=api` is explicitly set |
| `npm run dev:full`  | Frontend + SQLite API; forces API mode                             |
| `npm run build`     | Typecheck + production demo build; forces demo mode                |
| `npm run build:api` | Typecheck + production API-connected frontend                      |
| `npm run preview`   | Serve the last production build on port 4173                       |
| `npm run server`    | API and, when present, the built `dist/` frontend                  |
| `npm test`          | Business rules and API integration tests                           |
| `npm run check`     | Tests + production demo build                                      |

## Source map

- `src/pages/` — storefront, catalog, product, cart, checkout, orders, account, wallet, addresses.
- `src/components/` — layout, product cards, address form, modal and empty states.
- `src/lib/store.tsx` — explicit demo/API adapter, local persistence, session handling, queued mutations.
- `shared/catalog.mjs` — products, prices, sizes, brand labels, shipping options.
- `shared/store.mjs` — shared validation and cart/order/wallet business rules.
- `server/` — Express API, SQLite schema, password/session handling, operator CLI.
- `public/images/`, `public/fonts/` — bundled assets and font license.
- `tests/` — automated domain and API tests.
- `scripts/` — portable builds and local full-stack startup.
- `vercel.json` — Vite deployment settings and SPA rewrite.

Detailed references: [API](docs/API.md), [Backend setup](docs/BACKEND.md), [Demo walkthrough](docs/DEMO-WALKTHROUGH.md), [Validation](docs/VALIDATION.md), [Assets](docs/ASSET-CREDITS.md).

## Common fixes

- **Vercel cannot find package.json:** correct the Root Directory. The ZIP contains an outer `solehaven` folder.
- **A deep link returns 404:** keep `vercel.json` at the selected root, next to `package.json`, and redeploy.
- **The deployed page asks for a backend:** use `npm run build`, not `npm run build:api`; redeploy after changing the command.
- **Node or Vite engine errors:** install Node 24 LTS, close and reopen the terminal, then rerun `npm ci`.
- **Windows Rollup platform errors:** never copy `node_modules` from another OS. Delete that folder and run `npm ci` on Windows. This ZIP excludes dependencies and keeps cross-platform optional packages in the lockfile.
- **API sign-in reports origin not allowed:** open the exact `APP_ORIGIN`; localhost and 127.0.0.1 are different origins.
- **API auth works in dev but not over HTTP production:** Secure cookies require HTTPS. For local HTTP testing, leave `NODE_ENV` unset.
- **Lost demo data:** it is browser-local. A different browser/device/domain has separate data. Account → Reset demo restores the examples.
- **Insufficient wallet credit:** add simulated credit in Wallet or choose the demo card.

## Scope

No real payment gateway, bank connection, carrier integration, emails/SMS, password-reset service, inventory admin UI, production tax engine, or product upload service is included. Product management starts in the catalog source; an existing API database retains its seeded product records. This project provides a functional storefront and optional backend, with simulated commercial operations. For a real store, integrate those services and perform deployment-specific security, tax, and operational reviews.

Official deployment references checked during implementation:

- https://vercel.com/docs/frameworks/frontend/vite
- https://vercel.com/docs/routing/rewrites
- https://vite.dev/guide/static-deploy.html
- https://nodejs.org/download/release/latest-jod/docs/api/sqlite.html
