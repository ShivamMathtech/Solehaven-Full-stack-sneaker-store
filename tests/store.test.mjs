import test from "node:test";
import assert from "node:assert/strict";
import { initialState, quote, reduceStore } from "../shared/store.mjs";
import { products } from "../shared/catalog.mjs";
const context = { demo: true };
const act = (state, type, payload = {}) =>
  reduceStore(state, { type, payload }, products, context);
const cart = () =>
  act(initialState(), "addToCart", { productId: 1, size: 9, quantity: 1 });
const checkout = (state, overrides = {}) =>
  act(state, "checkout", {
    requestId: "request-123456",
    addressId: "home",
    delivery: "standard",
    payment: "Demo wallet",
    ...overrides,
  });
test("quote uses canonical catalogue prices, cents and percentage caps", () => {
  const q = quote(
    [{ productId: 1, size: 9, quantity: 2, price: 1 }],
    products,
    "standard",
    "WELCOME10",
  );
  assert.equal(q.subtotal, 25800);
  assert.equal(q.discount, 2500);
  assert.equal(q.shipping, 0);
  assert.equal(q.total, 23300);
});
test("promos validate minimums, known codes and shipping", () => {
  const c = [{ productId: 1, size: 9, quantity: 1 }];
  assert.throws(() => quote(c, products, "standard", "STEP20"), /at least/);
  assert.throws(() => quote(c, products, "standard", "FAKE"), /not valid/);
  assert.equal(quote(c, products, "nextday", "FREESHIP").shipping, 0);
  assert.throws(() => quote(c, products, "teleport"), /delivery/);
});
test("invalid quantities and sizes are rejected", () => {
  for (const quantity of [0, -1, 10, 1.5, "1", NaN])
    assert.throws(() => quote([{ productId: 1, size: 9, quantity }], products));
  assert.throws(() =>
    quote([{ productId: 1, size: 30, quantity: 1 }], products),
  );
});
test("duplicate lines and stock accumulated across sizes are rejected", () => {
  assert.throws(
    () =>
      quote(
        [
          { productId: 1, size: 9, quantity: 1 },
          { productId: 1, size: 9, quantity: 1 },
        ],
        products,
      ),
    /Duplicate/,
  );
  assert.throws(
    () =>
      quote(
        [
          { productId: 1, size: 9, quantity: 2 },
          { productId: 1, size: 10, quantity: 2 },
        ],
        products.map((p) => ({ ...p, stock: 3 })),
      ),
    /only 3/,
  );
});
test("cart merges the same variant and preserves different sizes", () => {
  let s = cart();
  s = act(s, "addToCart", { productId: 1, size: 9, quantity: 1 });
  s = act(s, "addToCart", { productId: 1, size: 10, quantity: 1 });
  assert.equal(s.cart.length, 2);
  assert.equal(s.cart[0].quantity, 2);
});
test("checkout creates snapshot, clears cart, debits wallet and is idempotent", () => {
  const before = cart();
  const s = checkout(before);
  assert.equal(s.cart.length, 0);
  assert.equal(s.wallet.balance, 19100);
  assert.equal(s.orders.length, before.orders.length + 1);
  assert.deepEqual(checkout(s), s);
  assert.equal(before.cart.length, 1);
  const edited = act(s, "saveAddress", {
    ...s.addresses[0],
    line1: "42 Different Street",
  });
  assert.equal(edited.orders[0].address.line1, "128 Maple Avenue");
});
test("insufficient wallet and missing address never mutate original", () => {
  const s = cart();
  s.wallet.balance = 1;
  const json = JSON.stringify(s);
  assert.throws(() => checkout(s), /Not enough/);
  assert.equal(JSON.stringify(s), json);
  assert.throws(() => checkout(s, { addressId: "unowned" }), /saved delivery/);
});
test("cancellation refunds wallet exactly once", () => {
  const s = checkout(cart());
  const cancelled = act(s, "cancelOrder", { id: s.orders[0].id });
  assert.equal(cancelled.wallet.balance, 32500);
  assert.equal(cancelled.orders[0].status, "cancelled");
  assert.throws(() => act(cancelled, "cancelOrder", { id: s.orders[0].id }));
});
test("tracking protects server-managed orders and reviews need delivery", () => {
  let s = checkout(cart());
  const id = s.orders[0].id;
  assert.throws(
    () =>
      reduceStore(s, { type: "advanceOrder", payload: { id } }, products, {
        demo: false,
      }),
    /managed/,
  );
  assert.throws(
    () =>
      act(s, "reviewOrder", { orderId: id, rating: 5, comment: "Great shoes" }),
    /delivered/,
  );
  for (let i = 0; i < 4; i++) s = act(s, "advanceOrder", { id });
  assert.equal(s.orders[0].status, "delivered");
  s = act(s, "reviewOrder", { orderId: id, rating: 5, comment: "Great shoes" });
  assert.equal(s.reviews.length, 1);
  assert.throws(
    () =>
      act(s, "reviewOrder", { orderId: id, rating: 5, comment: "Duplicate" }),
    /already/,
  );
  assert.throws(() => act(s, "cancelOrder", { id }));
});
test("only one default address survives edit and deletion", () => {
  let s = initialState();
  s = act(s, "saveAddress", {
    ...s.addresses[0],
    id: undefined,
    label: "Office",
    isDefault: true,
  });
  assert.equal(s.addresses.filter((a) => a.isDefault).length, 1);
  s = act(s, "deleteAddress", { id: s.addresses.find((a) => a.isDefault).id });
  assert.equal(s.addresses[0].isDefault, true);
  assert.throws(
    () => act(s, "saveAddress", { ...s.addresses[0], id: "foreign" }),
    /not found/,
  );
});
test("wallet top-up rejects invalid money and enforces limits", () => {
  const s = initialState();
  for (const amount of [0, -100, 100, 500.5, 100001, "500"])
    assert.throws(() => act(s, "topUp", { amount }));
  assert.equal(act(s, "topUp", { amount: 5000 }).wallet.balance, 37500);
});
test("disabled order notifications stay silent", () => {
  let s = cart();
  s = act(s, "updatePreferences", { orderUpdates: false });
  const n = s.notifications.length;
  s = checkout(s);
  assert.equal(s.notifications.length, n);
});
test("unknown actions and invalid emails are rejected", () => {
  assert.throws(() => act(initialState(), "makeAdmin"));
  assert.throws(() =>
    act(initialState(), "updateProfile", { name: "Alex", email: "invalid" }),
  );
});
