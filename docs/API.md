# API reference

Base path: `/api`. JSON requests and responses. Prices are integer USD cents. All cart/order operations validate against the server catalog. Never submit or collect real payment card information.

## Routes

| Method | Path             | Purpose                                                 |
| ------ | ---------------- | ------------------------------------------------------- |
| GET    | `/health`        | Liveness and simulated-payment status                   |
| GET    | `/products`      | Product catalog, including available stock              |
| GET    | `/products/:id`  | One product; 404 if absent                              |
| POST   | `/auth/register` | `{name,email,password}`; creates account and session    |
| POST   | `/auth/login`    | `{email,password}`; creates session                     |
| GET    | `/session`       | `{state,csrf}` or `{state:null,csrf:null}`              |
| GET    | `/state`         | Current customer's state; requires session              |
| POST   | `/auth/logout`   | `{}`; revokes session                                   |
| POST   | `/auth/password` | `{currentPassword,newPassword}`; revokes other sessions |
| POST   | `/actions`       | Validated customer-state mutation                       |

Authentication uses the `solehaven_session` HTTP-only cookie. Every authenticated POST also requires `X-CSRF-Token`, returned from login/register/session. Browser requests are same-origin. When the request has an Origin header, it must match `APP_ORIGIN` exactly. POST bodies must have `Content-Type: application/json`. Do not expose session cookies or CSRF tokens in logs.

Success responses: auth returns `{state,csrf}`, mutations return `{state,products}`, logout/password return `{ok:true}`. Errors are `{error:string}` with 400 for validation, 401 for missing/invalid session, 403 for origin/CSRF, 404 for missing resources, 409 for duplicate email, 415 for content type, and 429 for rate limiting.

## Actions

Send `{ "type": "addToCart", "payload": { "productId": 1, "size": 9, "quantity": 1 } }` to `/actions`.

| Type                | Payload                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `toggleWishlist`    | `productId`                                                                                                    |
| `addToCart`         | `productId`, `size`, `quantity` (1–9)                                                                          |
| `setQuantity`       | `key` (`productId:size`), `quantity`                                                                           |
| `removeFromCart`    | `key`                                                                                                          |
| `saveAddress`       | Optional owned `id`; `label`, `name`, `line1`, `city`, `region`, `postalCode`, `country`, `phone`, `isDefault` |
| `deleteAddress`     | Owned `id`                                                                                                     |
| `setDefaultAddress` | Owned `id`                                                                                                     |
| `updateProfile`     | `name`, `phone`; email editable only in browser demo                                                           |
| `updatePreferences` | `orderUpdates` and/or `offers` (booleans)                                                                      |
| `readNotifications` | None                                                                                                           |
| `topUp`             | `amount` in cents, 500–100000; simulated credit only                                                           |
| `checkout`          | `requestId`, owned `addressId`, `delivery`, `payment`, optional `promo`                                        |
| `cancelOrder`       | Owned `id`; only confirmed/processing orders                                                                   |
| `reviewOrder`       | Owned delivered `orderId`, `rating` 1–5, `comment` 3–1000 characters                                           |

`advanceOrder` is browser-demo-only and rejected by the API. Server-side fulfillment is controlled through the operator CLI.

Checkout deliveries: `standard`, `express`, `nextday`. Payments: `Demo card`, `Demo wallet`, `Cash on delivery`.

Checkout request IDs must be 8–100 characters. A repeated successful ID returns the existing state and does not create/debit/deduct again. Generate one ID per checkout attempt and retain it for retries. Snapshot prices and delivery address are preserved with the order. Customer identifiers in a payload do not change the authenticated customer.

A database transaction wraps state persistence, order records, stock deduction, and cancellation restocking. Stock is shared across sizes for each product in this version, not maintained as a separate inventory count per size. One order is allowed to review multiple included products via a single order review.

## Limits

- JSON body: 64 KiB.
- All API routes: 300 requests/minute per IP.
- Auth endpoints: 20 attempts/15 minutes per IP.
- Passwords: 10–128 characters, scrypt hashed with random salt.
- Sessions: 7 days; stored as token hashes; HTTP-only, SameSite=Strict; Secure in production.
- Cart: 60 unique variants; quantities 1–9, checked against combined product stock.
- Addresses: 20 per customer.
- Demo wallet: maximum $10,000; simulated funds only.
- Inbox: retains the latest 100 notifications.

Rate limiting is in-process. Use a shared limiter and a deliberately configured proxy trust policy if you later deploy multiple API instances behind a reverse proxy.
