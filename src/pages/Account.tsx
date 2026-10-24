import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Edit3,
  Gift,
  LogOut,
  MapPin,
  Plus,
  RotateCcw,
  Settings,
  ShieldCheck,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { money } from "../../shared/store.mjs";
import { isDemo, useStore } from "../lib/store";
import { AccountNav } from "../components/Layout";
import { AddressForm } from "../components/AddressForm";
import { dateText, Empty, ErrorText, Modal, PageTitle } from "../components/UI";
import type { Address } from "../types";
export function LoginPage() {
  const { login } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="auth-layout">
      <div className="auth-art">
        <img src="/images/hero.jpg" alt="Your next favorite sneaker" />
        <div>
          <span className="eyebrow">GOOD SOLES. GOOD COMPANY.</span>
          <h1>
            Your next move
            <br />
            starts here.
          </h1>
        </div>
      </div>
      <div className="auth-form">
        <span className="logo">
          <User size={24} />
        </span>
        <h1>
          {isDemo
            ? "Make yourself at home."
            : register
              ? "Join the good soles club."
              : "Good to see you again."}
        </h1>
        <p className="muted">
          {isDemo
            ? "Personalize your local demo profile. No password or real account required."
            : register
              ? "Create your account to save pairs, manage orders, and find your next favorite."
              : "Sign in for your favorites, orders, and little everyday upgrades."}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const f = new FormData(e.currentTarget);
            try {
              await login(
                {
                  name: String(f.get("name") || ""),
                  email: String(f.get("email")),
                  password: String(f.get("password") || ""),
                },
                register,
              );
              navigate(location.state?.from || "/account", { replace: true });
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {(register || isDemo) && (
            <label className="form-label">
              Your name
              <input
                required
                name="name"
                minLength={2}
                maxLength={80}
                autoComplete="name"
                placeholder="Alex Morgan"
              />
            </label>
          )}
          <label className="form-label">
            Email address
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          {!isDemo && (
            <label className="form-label">
              Password
              <input
                required
                name="password"
                type="password"
                minLength={10}
                maxLength={128}
                autoComplete={register ? "new-password" : "current-password"}
                placeholder="At least 10 characters"
              />
            </label>
          )}
          <ErrorText error={error} />
          <button className="btn primary full" disabled={busy}>
            {busy
              ? "One moment…"
              : isDemo
                ? "Save demo profile"
                : register
                  ? "Create account"
                  : "Sign in"}
            <ArrowRight size={17} />
          </button>
        </form>
        {!isDemo && (
          <p className="center">
            {register ? "Already part of the club?" : "New around here?"}{" "}
            <button
              className="text-button orange"
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Sign in" : "Create an account"}
            </button>
          </p>
        )}
        <p className="auth-note">
          <ShieldCheck size={17} />
          {isDemo
            ? "One demo profile per browser. Use sample details."
            : "Passwords are hashed. Payments remain simulated."}
        </p>
      </div>
    </div>
  );
}
export function AccountPage() {
  const { state, dispatch, toast, reset, logout, changePassword } = useStore();
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [password, setPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!state) return null;
  return (
    <>
      <PageTitle
        eyebrow="A LITTLE SPACE THAT’S YOURS"
        title={`Hey, ${state.profile.name.split(" ")[0]}.`}
        description="Your pairs, your places, your preferences. All right here."
      />
      <AccountNav />
      <div className="account-layout">
        <section className="panel profile-panel">
          <div className="profile-avatar">{state.profile.name.slice(0, 1)}</div>
          <h2>{state.profile.name}</h2>
          <p className="muted">{state.profile.email}</p>
          <span className="membership">
            <Gift size={14} />
            Good Soles Club
          </span>
          <button className="btn secondary full" onClick={() => setEdit(true)}>
            <Edit3 size={15} />
            Edit profile
          </button>
          <div className="profile-stats">
            <div>
              <strong>{state.orders.length}</strong>
              <span>Orders</span>
            </div>
            <div>
              <strong>{state.wishlist.length}</strong>
              <span>Saved pairs</span>
            </div>
          </div>
          <Link to="/wallet" className="wallet-shortcut">
            <Wallet size={19} />
            <span>
              Demo wallet<strong>{money(state.wallet.balance)}</strong>
            </span>
            <ChevronRight size={18} />
          </Link>
        </section>
        <div>
          <section className="panel">
            <h2>
              <Settings size={20} />
              Make it feel like you.
            </h2>
            <div className="setting-row">
              <div>
                <strong>Order updates</strong>
                <p>In-app updates when your order takes a step forward.</p>
              </div>
              <button
                role="switch"
                aria-checked={state.preferences.orderUpdates}
                aria-label="Order updates"
                className={`switch ${state.preferences.orderUpdates ? "on" : ""}`}
                onClick={async () => {
                  try {
                    await dispatch({
                      type: "updatePreferences",
                      payload: {
                        orderUpdates: !state.preferences.orderUpdates,
                      },
                    });
                  } catch (e) {
                    toast((e as Error).message);
                  }
                }}
              >
                <span />
              </button>
            </div>
            <div className="setting-row">
              <div>
                <strong>Special offers</strong>
                <p>Show the welcome offer notification in your inbox.</p>
              </div>
              <button
                role="switch"
                aria-checked={state.preferences.offers}
                aria-label="Special offers"
                className={`switch ${state.preferences.offers ? "on" : ""}`}
                onClick={async () => {
                  try {
                    await dispatch({
                      type: "updatePreferences",
                      payload: { offers: !state.preferences.offers },
                    });
                  } catch (e) {
                    toast((e as Error).message);
                  }
                }}
              >
                <span />
              </button>
            </div>
            <Link to="/addresses" className="setting-row setting-link">
              <div>
                <strong>Saved addresses</strong>
                <p>{state.addresses.length} places to send a little joy.</p>
              </div>
              <ChevronRight size={19} />
            </Link>
            <Link to="/about" className="setting-row setting-link">
              <div>
                <strong>Help & demo guide</strong>
                <p>A quick guide to the Solehaven experience.</p>
              </div>
              <ChevronRight size={19} />
            </Link>
          </section>
          <section className="panel account-security">
            <h2>
              <ShieldCheck size={20} />
              {isDemo ? "Your demo, your way." : "Account security"}
            </h2>
            <p className="muted">
              {isDemo
                ? "Everything stays in this browser. Reset anytime to restore the sample profile, orders, and wallet credit."
                : "Your account is stored on the server. Sessions use secure, HTTP-only cookies in production."}
            </p>
            {isDemo ? (
              <div className="account-buttons">
                <Link className="btn secondary" to="/login">
                  <User size={16} />
                  Personalize demo
                </Link>
                <button
                  className="btn secondary"
                  onClick={() => setResetOpen(true)}
                >
                  <RotateCcw size={16} />
                  Reset demo
                </button>
              </div>
            ) : (
              <div className="account-buttons">
                <button
                  className="btn secondary"
                  onClick={() => setPassword(true)}
                >
                  Change password
                </button>
                <button
                  className="btn secondary"
                  onClick={async () => {
                    try {
                      await logout();
                      navigate("/");
                    } catch (e) {
                      toast((e as Error).message);
                    }
                  }}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
      {edit && (
        <Modal title="A little more you" onClose={() => setEdit(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const f = new FormData(e.currentTarget);
              try {
                await dispatch({
                  type: "updateProfile",
                  payload: Object.fromEntries(f),
                });
                toast("Profile updated");
                setEdit(false);
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="form-label">
              Full name
              <input
                name="name"
                required
                minLength={2}
                maxLength={80}
                defaultValue={state.profile.name}
              />
            </label>
            <label className="form-label">
              Email address
              <input
                name="email"
                type="email"
                required
                readOnly={!isDemo}
                defaultValue={state.profile.email}
              />
            </label>
            <label className="form-label">
              Phone number
              <input
                name="phone"
                type="tel"
                maxLength={30}
                defaultValue={state.profile.phone}
              />
            </label>
            <ErrorText error={error} />
            <button className="btn primary full" disabled={busy}>
              Save changes
            </button>
          </form>
        </Modal>
      )}
      {resetOpen && (
        <Modal title="Start fresh?" onClose={() => setResetOpen(false)}>
          <p>
            This removes your local demo orders, cart, addresses, favorites, and
            reviews, then restores the sample data.
          </p>
          <div className="modal-actions">
            <button
              className="btn secondary"
              onClick={() => setResetOpen(false)}
            >
              Keep exploring
            </button>
            <button
              className="btn primary"
              onClick={() => {
                reset();
                setResetOpen(false);
              }}
            >
              Reset demo
            </button>
          </div>
        </Modal>
      )}
      {password && (
        <Modal title="Update your password" onClose={() => setPassword(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setBusy(true);
              try {
                await changePassword(
                  String(f.get("current")),
                  String(f.get("next")),
                );
                setPassword(false);
                toast("Password updated. Other sessions were signed out.");
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="form-label">
              Current password
              <input
                type="password"
                name="current"
                required
                minLength={10}
                maxLength={128}
                autoComplete="current-password"
              />
            </label>
            <label className="form-label">
              New password
              <input
                type="password"
                name="next"
                required
                minLength={10}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
            <ErrorText error={error} />
            <button className="btn primary full" disabled={busy}>
              Update password
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function AddressesPage() {
  const { state, dispatch, toast } = useStore();
  const [form, setForm] = useState<Address | true | null>(null);
  const [remove, setRemove] = useState<Address | null>(null);
  const [error, setError] = useState("");
  return (
    <>
      <PageTitle
        eyebrow="YOUR FAVORITE DESTINATIONS"
        title="Saved addresses."
        description="Home, work, wherever life takes you."
      >
        <button className="btn primary" onClick={() => setForm(true)}>
          <Plus size={17} />
          Add address
        </button>
      </PageTitle>
      <AccountNav />
      {state?.addresses.length ? (
        <div className="address-grid">
          {state.addresses.map((a) => (
            <article
              className={`panel address-card ${a.isDefault ? "default" : ""}`}
              key={a.id}
            >
              <div className="section-head">
                <span className="address-icon">
                  <MapPin size={22} />
                </span>
                {a.isDefault && (
                  <span className="tiny-badge">Default address</span>
                )}
              </div>
              <h2>{a.label}</h2>
              <strong>{a.name}</strong>
              <p>
                {a.line1}
                <br />
                {a.city}, {a.region} {a.postalCode}
                <br />
                {a.country}
              </p>
              <p className="muted">{a.phone}</p>
              <div className="address-actions">
                <button className="text-button" onClick={() => setForm(a)}>
                  <Edit3 size={15} />
                  Edit
                </button>
                {!a.isDefault && (
                  <button
                    className="text-button"
                    onClick={async () => {
                      try {
                        await dispatch({
                          type: "setDefaultAddress",
                          payload: { id: a.id },
                        });
                        toast("Default address updated");
                      } catch (e) {
                        toast((e as Error).message);
                      }
                    }}
                  >
                    <Check size={15} />
                    Set default
                  </button>
                )}
                <button
                  className="icon-btn danger"
                  aria-label={`Delete ${a.label} address`}
                  onClick={() => setRemove(a)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="Where should good things arrive?"
          text="Add an address to make checkout a little quicker."
          to="/account"
          label="Back to your profile"
        />
      )}
      {form && (
        <AddressForm
          address={form === true ? undefined : form}
          onClose={() => setForm(null)}
        />
      )}{" "}
      {remove && (
        <Modal title="Remove this address?" onClose={() => setRemove(null)}>
          <p>
            {remove.line1}, {remove.city}. Existing orders will keep their
            original delivery address.
          </p>
          <ErrorText error={error} />
          <button
            className="btn primary full"
            onClick={async () => {
              try {
                await dispatch({
                  type: "deleteAddress",
                  payload: { id: remove.id },
                });
                setRemove(null);
                toast("Address removed");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Remove address
          </button>
        </Modal>
      )}
    </>
  );
}
export function WalletPage() {
  const { state, dispatch, toast } = useStore();
  const [topup, setTopup] = useState(false);
  const [amount, setAmount] = useState("50");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!state) return null;
  return (
    <>
      <PageTitle
        eyebrow="A LITTLE SOMETHING IN RESERVE"
        title="Your wallet."
        description="Demo credit for all the pairs on your list. No real money involved."
      />
      <AccountNav />
      <div className="wallet-layout">
        <div>
          <div className="wallet-card">
            <div>
              <span>
                solehaven<span className="logo-dot">.</span>
              </span>
              <Wallet size={24} />
            </div>
            <small>AVAILABLE DEMO BALANCE</small>
            <strong>{money(state.wallet.balance)}</strong>
            <p>•••• &nbsp; •••• &nbsp; •••• &nbsp; 2048</p>
            <footer>
              <span>{state.profile.name.toUpperCase()}</span>
              <span>DEMO WALLET</span>
            </footer>
          </div>
          <button
            className="btn primary full topup-button"
            onClick={() => setTopup(true)}
          >
            <Plus size={18} />
            Add demo credit
          </button>
          <div className="notice">
            <ShieldCheck size={20} />
            <p>
              This is a simulated wallet. Credit has no cash value and cannot be
              withdrawn.
            </p>
          </div>
        </div>
        <section className="panel">
          <div className="section-head">
            <h2>Every little movement.</h2>
            <span className="muted">Transactions</span>
          </div>
          {state.wallet.transactions.length ? (
            state.wallet.transactions.map((t) => (
              <div className="transaction" key={t.id}>
                <span
                  className={`transaction-icon ${t.amount > 0 ? "credit" : ""}`}
                >
                  {t.amount > 0 ? (
                    <ArrowDownLeft size={20} />
                  ) : (
                    <ArrowUpRight size={20} />
                  )}
                </span>
                <div>
                  <strong>{t.title}</strong>
                  <small>{dateText(t.date)}</small>
                </div>
                <b className={t.amount > 0 ? "green" : ""}>
                  {t.amount > 0 ? "+" : "−"}
                  {money(Math.abs(t.amount))}
                </b>
              </div>
            ))
          ) : (
            <div className="inline-empty">
              Your first demo top-up starts the story.
            </div>
          )}
        </section>
      </div>
      {topup && (
        <Modal
          title="A little credit, a lot of possibilities."
          onClose={() => setTopup(false)}
        >
          <p className="muted">
            Add $5–$1,000 of simulated credit. No payment details required.
          </p>
          <div className="amount-presets">
            {[25, 50, 100, 250].map((n) => (
              <button
                className={Number(amount) === n ? "selected" : ""}
                key={n}
                onClick={() => setAmount(String(n))}
              >
                ${n}
              </button>
            ))}
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await dispatch({
                  type: "topUp",
                  payload: { amount: Math.round(Number(amount) * 100) },
                });
                setTopup(false);
                toast("Demo credit added to your wallet");
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="form-label">
              Amount (USD)
              <input
                type="number"
                min="5"
                max="1000"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <ErrorText error={error} />
            <button className="btn primary full" disabled={busy}>
              <CreditCard size={17} />
              {busy ? "Adding…" : "Add demo credit"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function NotificationsPage() {
  const { state, dispatch, toast } = useStore();
  const notices =
    state?.notifications.filter(
      (n) => n.id !== "welcome" || state.preferences.offers,
    ) || [];
  return (
    <>
      <PageTitle
        eyebrow="A LITTLE HEADS-UP"
        title="Your inbox."
        description="Order updates and little things worth knowing."
      >
        <button
          className="btn secondary"
          onClick={async () => {
            try {
              await dispatch({ type: "readNotifications" });
              toast("All caught up");
            } catch (e) {
              toast((e as Error).message);
            }
          }}
        >
          <Check size={16} />
          Mark all as read
        </button>
      </PageTitle>
      <div className="notifications">
        {notices.length ? (
          notices.map((n) => (
            <article
              className={`notification ${n.read ? "read" : ""}`}
              key={n.id}
            >
              <span className="notification-icon">
                <Bell size={22} />
              </span>
              <div>
                <h3>{n.title}</h3>
                <p>{n.message}</p>
                <small>{dateText(n.date)}</small>
              </div>
              {!n.read && <i className="unread-dot" />}
            </article>
          ))
        ) : (
          <Empty
            title="You’re all caught up."
            text="Updates will arrive here when your orders take their next step."
          />
        )}
      </div>
    </>
  );
}
