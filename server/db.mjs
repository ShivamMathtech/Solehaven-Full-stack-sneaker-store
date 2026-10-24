import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { products } from "../shared/catalog.mjs";
export function openDatabase(
  path = process.env.DATABASE_PATH || resolve("server/data/solehaven.sqlite"),
) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, csrf TEXT NOT NULL, expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS customer_state (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), data TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id);`);
  const insert = db.prepare(
    "INSERT OR IGNORE INTO products(id,data) VALUES (?,?)",
  );
  for (const product of products)
    insert.run(product.id, JSON.stringify(product));
  return db;
}
export const readProducts = (db) =>
  db
    .prepare("SELECT data FROM products ORDER BY id")
    .all()
    .map((row) => JSON.parse(row.data));
export const readState = (db, userId) =>
  JSON.parse(
    db.prepare("SELECT data FROM customer_state WHERE user_id=?").get(userId)
      .data,
  );
export function saveState(db, userId, state) {
  db.prepare("UPDATE customer_state SET data=? WHERE user_id=?").run(
    JSON.stringify(state),
    userId,
  );
  const insert = db.prepare(
    "INSERT INTO orders(id,user_id,data) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
  );
  for (const order of state.orders)
    insert.run(order.id, userId, JSON.stringify(order));
}
