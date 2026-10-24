import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import {
  randomBytes,
  randomUUID,
  createHash,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { openDatabase, readProducts, readState, saveState } from "./db.mjs";
import {
  initialState,
  reduceStore,
  emailValue,
  StoreError,
} from "../shared/store.mjs";
const hash = (value) => createHash("sha256").update(value).digest("hex");
function encodePassword(value) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(value, salt, 64).toString("hex")}`;
}
function checkPassword(value, stored) {
  const [salt, expected] = stored.split(":");
  const actual = scryptSync(value, salt, 64);
  return timingSafeEqual(Buffer.from(expected, "hex"), actual);
}
function validatePassword(value) {
  if (typeof value !== "string" || value.length < 10 || value.length > 128)
    throw new StoreError("Use a password between 10 and 128 characters.");
}
export function createApp(options = {}) {
  const db = options.db || openDatabase();
  const app = express();
  const production =
    options.production ?? process.env.NODE_ENV === "production";
  const origin =
    options.origin || process.env.APP_ORIGIN || "http://localhost:4173";
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "img-src": ["'self'", "data:"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "script-src": ["'self'"],
          "connect-src": ["'self'"],
        },
      },
      strictTransportSecurity: production ? undefined : false,
    }),
  );
  app.use(express.json({ limit: "64kb" }));
  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use("/api", (req, _res, next) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      if (req.get("origin") && req.get("origin") !== origin)
        return next(new StoreError("Request origin is not allowed.", 403));
      if (!req.is("application/json"))
        return next(new StoreError("Send application/json.", 415));
    }
    next();
  });
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 300,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many requests. Please wait a minute." },
    }),
  );
  const authLimit = rateLimit({
    windowMs: 15 * 60000,
    limit: options.authLimit || 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: "Too many sign-in attempts. Please try again in 15 minutes.",
    },
  });
  const session = (req) => {
    const cookie = (req.headers.cookie || "")
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith("solehaven_session="))
      ?.split("=")[1];
    if (!cookie) return null;
    return (
      db
        .prepare(
          "SELECT sessions.*, users.email FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires_at>?",
        )
        .get(hash(cookie), Date.now()) || null
    );
  };
  function requireSession(req, _res, next) {
    req.session = session(req);
    if (!req.session)
      return next(new StoreError("Please sign in to continue.", 401));
    if (req.method !== "GET" && req.get("x-csrf-token") !== req.session.csrf)
      return next(
        new StoreError(
          "Your session needs a refresh. Reload and try again.",
          403,
        ),
      );
    next();
  }
  function issueSession(res, userId) {
    const token = randomBytes(32).toString("hex");
    const csrf = randomBytes(24).toString("hex");
    db.prepare("DELETE FROM sessions WHERE expires_at<?").run(Date.now());
    db.prepare("INSERT INTO sessions VALUES (?,?,?,?)").run(
      hash(token),
      userId,
      csrf,
      Date.now() + 7 * 86400000,
    );
    res.cookie("solehaven_session", token, {
      httpOnly: true,
      secure: production,
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 86400000,
    });
    return csrf;
  }
  app.get("/api/health", (_req, res) =>
    res.json({ status: "ok", service: "solehaven", payments: "simulated" }),
  );
  app.get("/api/products", (_req, res) =>
    res.json({ products: readProducts(db) }),
  );
  app.get("/api/products/:id", (req, res) => {
    const product = readProducts(db).find(
      (p) => p.id === Number(req.params.id),
    );
    if (!product) throw new StoreError("Product not found.", 404);
    res.json({ product });
  });
  app.post("/api/auth/register", authLimit, (req, res) => {
    const email = emailValue(req.body.email);
    validatePassword(req.body.password);
    const name = String(req.body.name || "").trim();
    if (name.length < 2 || name.length > 80)
      throw new StoreError("Name must be 2–80 characters.");
    if (db.prepare("SELECT id FROM users WHERE email=?").get(email))
      throw new StoreError("This email is already registered.", 409);
    const userId = randomUUID();
    const password = encodePassword(req.body.password);
    const state = initialState({ name, email, demo: false });
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("INSERT INTO users VALUES (?,?,?,?)").run(
        userId,
        email,
        password,
        new Date().toISOString(),
      );
      db.prepare("INSERT INTO customer_state VALUES (?,?)").run(
        userId,
        JSON.stringify(state),
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    res.status(201).json({ state, csrf: issueSession(res, userId) });
  });
  app.post("/api/auth/login", authLimit, (req, res) => {
    const email = emailValue(req.body.email);
    validatePassword(req.body.password);
    const user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
    const fallback = "0123456789abcdef0123456789abcdef:" + "00".repeat(64);
    const valid = checkPassword(
      req.body.password,
      user?.password_hash || fallback,
    );
    if (!user || !valid)
      throw new StoreError("Email or password is incorrect.", 401);
    res.json({
      state: readState(db, user.id),
      csrf: issueSession(res, user.id),
    });
  });
  app.get("/api/session", (req, res) => {
    const s = session(req);
    res.json(
      s
        ? { state: readState(db, s.user_id), csrf: s.csrf }
        : { state: null, csrf: null },
    );
  });
  app.get("/api/state", requireSession, (req, res) =>
    res.json({ state: readState(db, req.session.user_id) }),
  );
  app.post("/api/auth/logout", requireSession, (req, res) => {
    db.prepare("DELETE FROM sessions WHERE token_hash=?").run(
      req.session.token_hash,
    );
    res.clearCookie("solehaven_session", {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: production,
    });
    res.json({ ok: true });
  });
  app.post("/api/auth/password", requireSession, authLimit, (req, res) => {
    validatePassword(req.body.currentPassword);
    validatePassword(req.body.newPassword);
    const user = db
      .prepare("SELECT * FROM users WHERE id=?")
      .get(req.session.user_id);
    if (!checkPassword(req.body.currentPassword, user.password_hash))
      throw new StoreError("Current password is incorrect.", 403);
    db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(
      encodePassword(req.body.newPassword),
      user.id,
    );
    db.prepare("DELETE FROM sessions WHERE user_id=? AND token_hash<>?").run(
      user.id,
      req.session.token_hash,
    );
    res.json({ ok: true });
  });
  app.post("/api/actions", requireSession, (req, res) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const before = readState(db, req.session.user_id);
      const catalog = readProducts(db);
      const after = reduceStore(before, req.body, catalog, {
        demo: false,
        id: randomUUID,
      });
      const newOrders = after.orders.filter(
        (o) => !before.orders.some((p) => p.id === o.id),
      );
      const cancelled = after.orders.filter(
        (o) =>
          o.status === "cancelled" &&
          before.orders.find((p) => p.id === o.id)?.status !== "cancelled",
      );
      for (const [orders, sign] of [
        [newOrders, -1],
        [cancelled, 1],
      ])
        for (const order of orders)
          for (const line of order.items) {
            const p = catalog.find((p) => p.id === line.productId);
            p.stock += sign * line.quantity;
            db.prepare("UPDATE products SET data=? WHERE id=?").run(
              JSON.stringify(p),
              p.id,
            );
          }
      saveState(db, req.session.user_id, after);
      db.exec("COMMIT");
      res.json({ state: after, products: catalog });
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });
  app.use("/api", (_req, _res, next) =>
    next(new StoreError("Endpoint not found.", 404)),
  );
  const dist = options.dist || resolve("dist");
  if (existsSync(resolve(dist, "index.html"))) {
    app.use(express.static(dist));
    app.get("/{*path}", (_req, res) =>
      res.sendFile(resolve(dist, "index.html")),
    );
  }
  app.use((error, _req, res, _next) => {
    const status =
      error.status || (error.type === "entity.parse.failed" ? 400 : 500);
    if (status >= 500) console.error(error);
    res
      .status(status)
      .json({
        error:
          status >= 500
            ? "Something went wrong. Please try again."
            : error.message,
      });
  });
  return { app, db };
}
