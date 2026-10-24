import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "../server/app.mjs";
import { openDatabase, readProducts } from "../server/db.mjs";
let app, db, server, base;
const origin = "http://localhost:4173";
before(async () => {
  db = openDatabase(":memory:");
  ({ app } = createApp({ db, origin, authLimit: 200 }));
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
});
async function request(path, data, client = {}, headers = {}) {
  const r = await fetch(base + path, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      ...(client.cookie ? { Cookie: client.cookie } : {}),
      ...(client.csrf ? { "X-CSRF-Token": client.csrf } : {}),
      ...headers,
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const body = await r.json();
  return {
    status: r.status,
    body,
    cookie: r.headers.get("set-cookie")?.split(";")[0],
    headers: r.headers,
  };
}
async function signup(label) {
  const email = `${label}-${crypto.randomUUID()}@example.com`;
  const r = await request("/api/auth/register", {
    name: "Test Shopper",
    email,
    password: "test-password-2026",
  });
  assert.equal(r.status, 201);
  return { email, cookie: r.cookie, csrf: r.body.csrf, state: r.body.state };
}
const action = (client, type, payload = {}) =>
  request("/api/actions", { type, payload }, client);
async function ready(client, productId = 1) {
  let r = await action(client, "saveAddress", {
    label: "Home",
    name: "Test Shopper",
    line1: "10 Test Street",
    city: "Portland",
    region: "Oregon",
    postalCode: "97205",
    country: "US",
    phone: "555-0100",
    isDefault: true,
  });
  assert.equal(r.status, 200);
  client.addressId = r.body.state.addresses[0].id;
  r = await action(client, "addToCart", { productId, size: 9, quantity: 1 });
  assert.equal(r.status, 200);
  return client;
}
const orderPayload = (c) => ({
  requestId: crypto.randomUUID(),
  addressId: c.addressId,
  delivery: "standard",
  payment: "Demo card",
});
test("public catalogue works while protected state requires a session", async () => {
  assert.equal((await request("/api/health")).status, 200);
  assert.equal((await request("/api/products")).body.products.length, 12);
  assert.equal((await request("/api/state")).status, 401);
  assert.equal((await request("/api/products/900")).status, 404);
});
test("register hashes passwords and sets HTTP-only cookies; login rejects wrong password", async () => {
  const c = await signup("auth");
  const row = db
    .prepare("SELECT password_hash FROM users WHERE email=?")
    .get(c.email);
  assert.notEqual(row.password_hash, "test-password-2026");
  assert.ok(row.password_hash.includes(":"));
  const login = await request("/api/auth/login", {
    email: c.email,
    password: "test-password-2026",
  });
  assert.equal(login.status, 200);
  assert.match(login.headers.get("set-cookie"), /HttpOnly/);
  assert.match(login.headers.get("set-cookie"), /SameSite=Strict/);
  assert.equal(
    (
      await request("/api/auth/login", {
        email: c.email,
        password: "wrong-password",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request("/api/auth/register", {
        name: "X",
        email: "bad",
        password: "1",
      })
    ).status,
    400,
  );
});
test("mutations reject CSRF omissions, foreign origins and unknown actions", async () => {
  const c = await signup("csrf");
  assert.equal(
    (await action({ cookie: c.cookie }, "topUp", { amount: 5000 })).status,
    403,
  );
  assert.equal(
    (
      await request(
        "/api/actions",
        { type: "topUp", payload: { amount: 5000 } },
        c,
        { Origin: "https://attacker.invalid" },
      )
    ).status,
    403,
  );
  assert.equal((await action(c, "makeAdmin")).status, 400);
  assert.equal((await action(c, "advanceOrder", { id: "fake" })).status, 400);
});
test("checkout is authoritative, atomic, idempotent and restocks on cancellation", async () => {
  const c = await ready(await signup("order"));
  await action(c, "topUp", { amount: 50000 });
  const stock = readProducts(db).find((p) => p.id === 1).stock;
  const payload = {
    ...orderPayload(c),
    payment: "Demo wallet",
    price: 1,
    total: 1,
  };
  const r = await action(c, "checkout", payload);
  assert.equal(r.status, 200);
  assert.equal(r.body.state.orders[0].total, 13400);
  assert.equal(r.body.state.wallet.balance, 36600);
  assert.equal(readProducts(db).find((p) => p.id === 1).stock, stock - 1);
  const repeat = await action(c, "checkout", payload);
  assert.equal(repeat.status, 200);
  assert.equal(repeat.body.state.orders.length, 1);
  assert.equal(readProducts(db).find((p) => p.id === 1).stock, stock - 1);
  const cancelled = await action(c, "cancelOrder", {
    id: r.body.state.orders[0].id,
  });
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.body.state.wallet.balance, 50000);
  assert.equal(readProducts(db).find((p) => p.id === 1).stock, stock);
  assert.equal(
    (await action(c, "cancelOrder", { id: r.body.state.orders[0].id })).status,
    400,
  );
});
test("one customer cannot cancel or read another customer’s order", async () => {
  const a = await ready(await signup("owner"));
  const b = await signup("stranger");
  const order = await action(a, "checkout", orderPayload(a));
  const id = order.body.state.orders[0].id;
  assert.equal((await action(b, "cancelOrder", { id })).status, 400);
  assert.equal(
    (await request("/api/state", undefined, b)).body.state.orders.length,
    0,
  );
});
test("competing checkouts cannot oversell the last pair", async () => {
  const p = readProducts(db).find((p) => p.id === 12);
  p.stock = 1;
  db.prepare("UPDATE products SET data=? WHERE id=12").run(JSON.stringify(p));
  const a = await ready(await signup("racea"), 12);
  const b = await ready(await signup("raceb"), 12);
  const results = await Promise.all([
    action(a, "checkout", orderPayload(a)),
    action(b, "checkout", orderPayload(b)),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
  assert.equal(readProducts(db).find((p) => p.id === 12).stock, 0);
  const failed = results.find((r) => r.status === 400);
  assert.match(failed.body.error, /only 0/);
});
test("backend session survives reread; password update invalidates other sessions and logout revokes current", async () => {
  const c = await signup("session");
  await action(c, "topUp", { amount: 5000 });
  assert.equal(
    (await request("/api/session", undefined, c)).body.state.wallet.balance,
    5000,
  );
  const second = await request("/api/auth/login", {
    email: c.email,
    password: "test-password-2026",
  });
  assert.equal(
    (
      await request(
        "/api/auth/password",
        {
          currentPassword: "test-password-2026",
          newPassword: "better-password-2026",
        },
        c,
      )
    ).status,
    200,
  );
  assert.equal(
    (await request("/api/state", undefined, { cookie: second.cookie })).status,
    401,
  );
  assert.equal((await request("/api/auth/logout", {}, c)).status, 200);
  assert.equal((await request("/api/state", undefined, c)).status, 401);
});
