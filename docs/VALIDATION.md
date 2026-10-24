# Validation report

Verified on 24 October 2026 with Node.js 24.19.0 and npm 11.9.0 in Linux.

| Check | Result |
| --- | --- |
| `npm run build:api` | Passed TypeScript checking and Vite production compilation |
| `npm run check` | All 20 automated tests passed; default production demo build passed |
| `npm audit --audit-level=moderate` | Reported 0 known vulnerabilities at verification time |
| Lockfile consistency | Root dependencies match package.json; Windows optional Rollup packages present |
| Local assets | Shoe photographs, font files, favicon, and font license bundled |

## Browser checks

Verified the demo in the managed browser without starting the API:

- Desktop homepage rendered with local photos and typography.
- Quick-add dialog required a size and added the chosen pair to the bag.
- `WELCOME10` reduced a $129 item by $12.90; $5 delivery produced a $121.10 total.
- Delivery selection, simulated wallet payment, review, and order confirmation completed.
- The completed order survived a page refresh.
- Tracking advanced from confirmed through delivered.
- A delivered order accepted a review and then disabled duplicate review submission.
- A 390-pixel mobile preview rendered the home page and bottom navigation.
- Mobile catalog search for “Velocity” returned the matching shoe.

A runtime issue with `crypto.randomUUID` on non-secure local HTTP previews was found and fixed with a `crypto.getRandomValues` fallback. Vercel HTTPS and localhost also remain supported.

## Automated coverage

The tests cover canonical price calculation, discount caps, shipping rules, bad quantities/sizes, duplicate variants, aggregated stock checks, immutable updates, checkout idempotency, wallet insufficiency, cancellation refunds, review eligibility, default addresses, notification preferences, registration/login, password hashing, CSRF, origin checks, customer isolation, competing purchases of the final stock item, password changes, and logout/session revocation.

## Verification boundaries

- The project was not deployed to a user's Vercel account. Deployment configuration and production builds were checked locally.
- Automated API tests exercise Express and SQLite using an isolated in-memory database. Full-stack authentication was not manually exercised in a browser.
- Windows launch scripts are included and use portable Node/npm commands, but no Windows host was available for execution.
- Dockerfile is included as an optional backend container recipe; no Docker image was built in this environment.
- Browser interaction verification used the development preview; production demo and API bundles were checked through their builds.
- No real payment, email, carrier, tax, or bank integration is claimed.
