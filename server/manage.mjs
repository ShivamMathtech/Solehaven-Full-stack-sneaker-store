import { openDatabase, readState, saveState } from "./db.mjs";
import { orderStatuses } from "../shared/catalog.mjs";
const [command, orderId, status] = process.argv.slice(2);
if (command !== "order-status" || !orderStatuses.includes(status)) {
  console.error(
    "Usage: node server/manage.mjs order-status ORDER_ID processing|shipped|out_for_delivery|delivered",
  );
  process.exit(1);
}
const db = openDatabase();
try {
  db.exec("BEGIN IMMEDIATE");
  const row = db.prepare("SELECT user_id FROM orders WHERE id=?").get(orderId);
  if (!row) throw new Error("Order not found");
  const state = readState(db, row.user_id);
  const order = state.orders.find((o) => o.id === orderId);
  if (
    order.status === "cancelled" ||
    orderStatuses.indexOf(status) !== orderStatuses.indexOf(order.status) + 1
  )
    throw new Error("Status must advance one step from the current status.");
  order.status = status;
  order.history.push({ status, date: new Date().toISOString() });
  state.notifications.unshift({
    id: crypto.randomUUID(),
    title: "Order update",
    message: `${orderId}: ${status.replaceAll("_", " ")}`,
    date: new Date().toISOString(),
    read: false,
  });
  saveState(db, row.user_id, state);
  db.exec("COMMIT");
  console.log(`${orderId} updated to ${status}`);
} catch (error) {
  db.exec("ROLLBACK");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
