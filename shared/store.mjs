import {
  products as seedProducts,
  shippingOptions,
  orderStatuses,
} from "./catalog.mjs";
// getRandomValues also works on local HTTP previews where randomUUID is unavailable.
export const createId = () =>
  globalThis.crypto.randomUUID?.() ||
  Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
export class StoreError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const requireValue = (condition, message) => {
  if (!condition) throw new StoreError(message);
};
const str = (value, min, max, label) => {
  requireValue(
    typeof value === "string" &&
      value.trim().length >= min &&
      value.trim().length <= max,
    `${label} must be ${min}–${max} characters.`,
  );
  return value.trim();
};
export const emailValue = (value) => {
  const email = str(value, 3, 254, "Email").toLowerCase();
  requireValue(
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    "Enter a valid email address.",
  );
  return email;
};
export const lineKey = (line) => `${line.productId}:${line.size}`;
export const money = (cents) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
export function initialState({
  name = "Alex Morgan",
  email = "alex@example.com",
  demo = true,
} = {}) {
  const state = {
    version: 1,
    profile: { name, email, phone: "" },
    cart: [],
    wishlist: demo ? [2, 5] : [],
    addresses: [],
    orders: [],
    reviews: [],
    wallet: { balance: demo ? 32500 : 0, transactions: [] },
    preferences: { orderUpdates: true, offers: true },
    notifications: [],
  };
  if (demo) {
    state.addresses.push({
      id: "home",
      label: "Home",
      name,
      line1: "128 Maple Avenue",
      city: "Portland",
      region: "Oregon",
      postalCode: "97205",
      country: "United States",
      phone: "202-555-0148",
      isDefault: true,
    });
    state.wallet.transactions.push({
      id: "starter-credit",
      title: "Welcome demo credit",
      amount: 32500,
      date: new Date().toISOString(),
    });
    for (const [i, productId, status] of [
      [1, 5, "shipped"],
      [2, 3, "delivered"],
    ]) {
      const p = seedProducts.find((p) => p.id === productId);
      state.orders.push({
        id: `SH-DEMO-100${i}`,
        requestId: `seed-${i}`,
        date: new Date(Date.now() - i * 86400000 * 4).toISOString(),
        status,
        items: [{ ...p, productId, size: 9, quantity: 1 }],
        subtotal: p.price,
        discount: 0,
        shipping: 500,
        total: p.price + 500,
        address: { ...state.addresses[0] },
        payment: "Demo card",
        delivery: "standard",
        promo: "",
        history: orderStatuses
          .slice(0, orderStatuses.indexOf(status) + 1)
          .map((status, j) => ({
            status,
            date: new Date(Date.now() - (8 - j) * 86400000).toISOString(),
          })),
      });
    }
    state.notifications.push({
      id: "welcome",
      title: "Your next favorite pair is waiting",
      message: "Use WELCOME10 for 10% off your next demo order, up to $25.",
      date: new Date().toISOString(),
      read: false,
    });
  }
  return state;
}
export function quote(
  cart,
  catalog = seedProducts,
  delivery = "standard",
  promo = "",
) {
  requireValue(Array.isArray(cart) && cart.length <= 60, "Invalid cart.");
  const aggregated = new Map();
  const seen = new Set();
  const items = cart.map((line) => {
    const p = catalog.find((p) => p.id === line.productId);
    requireValue(
      p && p.sizes.includes(line.size),
      "A selected product or size is unavailable.",
    );
    requireValue(
      Number.isInteger(line.quantity) &&
        line.quantity >= 1 &&
        line.quantity <= 9,
      "Quantity must be between 1 and 9.",
    );
    requireValue(!seen.has(lineKey(line)), "Duplicate cart item.");
    seen.add(lineKey(line));
    aggregated.set(p.id, (aggregated.get(p.id) || 0) + line.quantity);
    requireValue(
      aggregated.get(p.id) <= p.stock,
      `${p.name} has only ${p.stock} pairs available.`,
    );
    return { ...p, productId: p.id, size: line.size, quantity: line.quantity };
  });
  const option = shippingOptions.find((o) => o.id === delivery);
  requireValue(option, "Choose a delivery option.");
  const subtotal = items.reduce((sum, p) => sum + p.price * p.quantity, 0);
  let shipping = items.length
    ? delivery === "standard" && subtotal >= 15000
      ? 0
      : option.price
    : 0;
  let discount = 0;
  const code = String(promo).trim().toUpperCase();
  if (code) {
    requireValue(
      ["WELCOME10", "STEP20", "FREESHIP"].includes(code),
      "That promo code is not valid.",
    );
    if (code === "WELCOME10")
      discount = Math.min(2500, Math.round(subtotal * 0.1));
    if (code === "STEP20") {
      requireValue(
        subtotal >= 20000,
        "STEP20 needs an order of at least $200.",
      );
      discount = Math.min(4000, Math.round(subtotal * 0.2));
    }
    if (code === "FREESHIP") shipping = 0;
  }
  return {
    items,
    subtotal,
    discount,
    shipping,
    total: subtotal - discount + shipping,
    promo: code,
  };
}
export function reduceStore(
  original,
  action,
  catalog = seedProducts,
  context = {},
) {
  requireValue(action && typeof action.type === "string", "Invalid action.");
  const state = structuredClone(original);
  const payload = action.payload || {};
  const now = context.now || new Date().toISOString();
  const id = () => context.id?.() || createId();
  const notify = (title, message) => {
    if (state.preferences.orderUpdates)
      state.notifications.unshift({
        id: id(),
        title,
        message,
        date: now,
        read: false,
      });
  };
  switch (action.type) {
    case "toggleWishlist": {
      requireValue(
        catalog.some((p) => p.id === payload.productId),
        "Product not found.",
      );
      state.wishlist = state.wishlist.includes(payload.productId)
        ? state.wishlist.filter((n) => n !== payload.productId)
        : [...state.wishlist, payload.productId];
      break;
    }
    case "addToCart": {
      const key = lineKey(payload);
      const line = state.cart.find((l) => lineKey(l) === key);
      if (line) line.quantity += payload.quantity || 1;
      else
        state.cart.push({
          productId: payload.productId,
          size: payload.size,
          quantity: payload.quantity || 1,
        });
      quote(state.cart, catalog);
      break;
    }
    case "setQuantity": {
      const line = state.cart.find((l) => lineKey(l) === payload.key);
      requireValue(line, "Cart item not found.");
      line.quantity = payload.quantity;
      quote(state.cart, catalog);
      break;
    }
    case "removeFromCart":
      state.cart = state.cart.filter((l) => lineKey(l) !== payload.key);
      break;
    case "saveAddress": {
      requireValue(
        state.addresses.length < 20 ||
          state.addresses.some((a) => a.id === payload.id),
        "You can save up to 20 addresses.",
      );
      const existing = state.addresses.find((a) => a.id === payload.id);
      requireValue(!payload.id || existing, "Address not found.");
      const address = {
        id: existing?.id || id(),
        label: str(payload.label, 1, 30, "Label"),
        name: str(payload.name, 2, 80, "Recipient"),
        line1: str(payload.line1, 4, 180, "Street address"),
        city: str(payload.city, 2, 80, "City"),
        region: str(payload.region, 2, 80, "State / region"),
        postalCode: str(payload.postalCode, 2, 20, "Postal code"),
        country: str(payload.country, 2, 80, "Country"),
        phone: str(payload.phone, 5, 30, "Phone"),
        isDefault: Boolean(payload.isDefault || !state.addresses.length),
      };
      if (address.isDefault)
        state.addresses.forEach((a) => (a.isDefault = false));
      state.addresses = [
        ...state.addresses.filter((a) => a.id !== address.id),
        address,
      ];
      if (!state.addresses.some((a) => a.isDefault))
        state.addresses[0].isDefault = true;
      break;
    }
    case "deleteAddress":
      state.addresses = state.addresses.filter((a) => a.id !== payload.id);
      if (state.addresses.length && !state.addresses.some((a) => a.isDefault))
        state.addresses[0].isDefault = true;
      break;
    case "setDefaultAddress":
      requireValue(
        state.addresses.some((a) => a.id === payload.id),
        "Address not found.",
      );
      state.addresses.forEach((a) => (a.isDefault = a.id === payload.id));
      break;
    case "updateProfile":
      state.profile = {
        ...state.profile,
        name: str(payload.name, 2, 80, "Name"),
        phone: str(payload.phone || "", 0, 30, "Phone"),
        ...(context.demo ? { email: emailValue(payload.email) } : {}),
      };
      break;
    case "updatePreferences":
      for (const key of ["orderUpdates", "offers"])
        if (typeof payload[key] === "boolean")
          state.preferences[key] = payload[key];
      break;
    case "readNotifications":
      state.notifications.forEach((n) => (n.read = true));
      break;
    case "topUp":
      requireValue(
        Number.isInteger(payload.amount) &&
          payload.amount >= 500 &&
          payload.amount <= 100000,
        "Add between $5 and $1,000 in demo credit.",
      );
      requireValue(
        state.wallet.balance + payload.amount <= 1000000,
        "Maximum demo balance is $10,000.",
      );
      state.wallet.balance += payload.amount;
      state.wallet.transactions.unshift({
        id: id(),
        title: "Demo wallet top-up",
        amount: payload.amount,
        date: now,
      });
      break;
    case "checkout": {
      const requestId = str(payload.requestId, 8, 100, "Request ID");
      if (state.orders.some((o) => o.requestId === requestId)) return state;
      requireValue(state.cart.length > 0, "Your bag is empty.");
      const address = state.addresses.find((a) => a.id === payload.addressId);
      requireValue(address, "Choose a saved delivery address.");
      requireValue(
        ["Demo card", "Demo wallet", "Cash on delivery"].includes(
          payload.payment,
        ),
        "Choose a payment method.",
      );
      const totals = quote(
        state.cart,
        catalog,
        payload.delivery,
        payload.promo,
      );
      if (payload.payment === "Demo wallet")
        requireValue(
          state.wallet.balance >= totals.total,
          "Not enough demo wallet credit. Add credit in your wallet.",
        );
      const orderId = `SH-${id().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
      state.orders.unshift({
        id: orderId,
        requestId,
        date: now,
        status: "confirmed",
        ...totals,
        address: { ...address },
        payment: payload.payment,
        delivery: payload.delivery,
        history: [{ status: "confirmed", date: now }],
      });
      if (payload.payment === "Demo wallet") {
        state.wallet.balance -= totals.total;
        state.wallet.transactions.unshift({
          id: id(),
          title: `Order ${orderId}`,
          amount: -totals.total,
          date: now,
        });
      }
      state.cart = [];
      notify(
        "You’re all set!",
        `Order ${orderId} is confirmed. ${context.demo ? "This is a demo order." : "Payment is simulated; no money was charged."}`,
      );
      break;
    }
    case "advanceOrder": {
      requireValue(context.demo, "Order progress is managed by the store.");
      const order = state.orders.find((o) => o.id === payload.id);
      requireValue(
        order && order.status !== "cancelled" && order.status !== "delivered",
        "This order cannot advance.",
      );
      order.status = orderStatuses[orderStatuses.indexOf(order.status) + 1];
      order.history.push({ status: order.status, date: now });
      notify(
        "Order update",
        `${order.id}: ${order.status.replaceAll("_", " ")}`,
      );
      break;
    }
    case "cancelOrder": {
      const order = state.orders.find((o) => o.id === payload.id);
      requireValue(
        order && ["confirmed", "processing"].includes(order.status),
        "Only unshipped orders can be cancelled.",
      );
      order.status = "cancelled";
      order.history.push({ status: "cancelled", date: now });
      if (order.payment === "Demo wallet") {
        state.wallet.balance += order.total;
        state.wallet.transactions.unshift({
          id: id(),
          title: `Refund ${order.id}`,
          amount: order.total,
          date: now,
        });
      }
      notify("Order cancelled", `${order.id} has been cancelled.`);
      break;
    }
    case "reviewOrder": {
      const order = state.orders.find((o) => o.id === payload.orderId);
      requireValue(
        order?.status === "delivered",
        "Only delivered orders can be reviewed.",
      );
      requireValue(
        !state.reviews.some((r) => r.orderId === payload.orderId),
        "You have already reviewed this order.",
      );
      requireValue(
        Number.isInteger(payload.rating) &&
          payload.rating >= 1 &&
          payload.rating <= 5,
        "Choose a rating from 1 to 5.",
      );
      state.reviews.unshift({
        id: id(),
        orderId: order.id,
        productIds: order.items.map((p) => p.productId),
        rating: payload.rating,
        comment: str(payload.comment, 3, 1000, "Review"),
        date: now,
      });
      break;
    }
    default:
      throw new StoreError("Unknown action.");
  }
  state.notifications = state.notifications.slice(0, 100);
  return state;
}
