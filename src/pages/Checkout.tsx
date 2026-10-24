import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Heart,
  LockKeyhole,
  MapPin,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  Wallet,
} from "lucide-react";
import { createId, lineKey, money, quote } from "../../shared/store.mjs";
import { shippingOptions } from "../../shared/catalog.mjs";
import { useStore } from "../lib/store";
import { Empty, ErrorText, PageTitle } from "../components/UI";
import { AddressForm } from "../components/AddressForm";
import type { Order } from "../types";
type Totals = Pick<
  Order,
  "items" | "subtotal" | "shipping" | "discount" | "total" | "promo"
>;
export function CartPage() {
  const { state, products, dispatch, toast } = useStore();
  const [code, setCode] = useState("");
  const [promo, setPromo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!state?.cart.length)
    return (
      <>
        <PageTitle eyebrow="THE GOOD STUFF" title="Your shopping bag." />
        <Empty
          title="Your next favorite belongs here."
          text="Start with a pair that feels like you. Your bag is ready when you are."
        />
      </>
    );
  let totals: Totals | undefined;
  let validation = "";
  try {
    totals = quote(state.cart, products, "standard", promo);
  } catch (e) {
    validation = (e as Error).message;
  }
  async function act(type: string, payload: Record<string, unknown>) {
    setBusy(true);
    try {
      await dispatch({ type, payload });
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="GOOD CHOICES, ALL AROUND"
        title="Your shopping bag."
        description={`${state.cart.reduce((s, l) => s + l.quantity, 0)} items on the way to being yours.`}
      >
        <Link to="/shop" className="text-link">
          <ArrowLeft size={16} />
          Keep exploring
        </Link>
      </PageTitle>
      <div className="checkout-layout">
        <div>
          <div className="cart-card">
            {state.cart.map((line) => {
              const p = products.find((p) => p.id === line.productId);
              if (!p) return null;
              return (
                <div className="cart-line" key={lineKey(line)}>
                  <Link to={`/product/${p.id}`}>
                    <img src={p.image} alt={p.name} />
                  </Link>
                  <div className="cart-line-info">
                    <small>
                      {p.brand} / {p.category}
                    </small>
                    <Link to={`/product/${p.id}`}>
                      <h3>{p.name}</h3>
                    </Link>
                    <p>
                      {p.color} · Size US {line.size}
                    </p>
                    <div className="cart-line-actions">
                      <div className="quantity-control">
                        <button
                          aria-label={`Decrease ${p.name} quantity`}
                          disabled={busy || line.quantity <= 1}
                          onClick={() =>
                            act("setQuantity", {
                              key: lineKey(line),
                              quantity: line.quantity - 1,
                            })
                          }
                        >
                          −
                        </button>
                        <span>{line.quantity}</span>
                        <button
                          aria-label={`Increase ${p.name} quantity`}
                          disabled={busy || line.quantity >= 9}
                          onClick={() =>
                            act("setQuantity", {
                              key: lineKey(line),
                              quantity: line.quantity + 1,
                            })
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="text-button save-later"
                        disabled={busy}
                        onClick={async () => {
                          if (!state.wishlist.includes(p.id))
                            await act("toggleWishlist", { productId: p.id });
                          await act("removeFromCart", { key: lineKey(line) });
                          toast("Saved for a little later");
                        }}
                      >
                        <Heart size={15} />
                        Save for later
                      </button>
                    </div>
                  </div>
                  <div className="cart-line-price">
                    <strong>{money(p.price * line.quantity)}</strong>
                    <button
                      className="icon-btn"
                      disabled={busy}
                      aria-label={`Remove ${p.name} from bag`}
                      onClick={() =>
                        act("removeFromCart", { key: lineKey(line) })
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="shipping-callout">
            <Truck size={21} />
            <p>
              {totals && totals.subtotal >= 15000
                ? "Good news. Your standard delivery is on us."
                : `A little closer to free shipping. ${money(Math.max(0, 15000 - (totals?.subtotal || 0)))} to go.`}
            </p>
          </div>
          <ErrorText error={error || validation} />
        </div>
        <aside className="order-summary">
          <h2>The good-to-go total.</h2>
          <div className="summary-lines">
            <p>
              <span>Subtotal</span>
              <strong>{money(totals?.subtotal || 0)}</strong>
            </p>
            <p>
              <span>Standard delivery</span>
              <strong>
                {totals?.shipping ? money(totals.shipping) : "Free"}
              </strong>
            </p>
            {!!totals?.discount && (
              <p className="green">
                <span>Promo savings</span>
                <strong>−{money(totals.discount)}</strong>
              </p>
            )}
          </div>
          <form
            className="promo-form"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                quote(state.cart, products, "standard", code);
                setPromo(code.toUpperCase());
                setError("");
                toast("Your promo is applied");
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            <Tag size={16} />
            <input
              aria-label="Promo code"
              placeholder="Add a promo code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button type="submit">Apply</button>
          </form>
          {promo && (
            <div className="applied-code">
              {promo}
              <button
                onClick={() => {
                  setPromo("");
                  setCode("");
                }}
                aria-label="Remove promo code"
              >
                ×
              </button>
            </div>
          )}
          <p className="promo-tip">
            A little welcome: try <strong>WELCOME10</strong>
          </p>
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(totals?.total || 0)}</strong>
          </div>
          <p className="muted tiny">USD · No additional demo taxes</p>
          {validation ? (
            <button disabled className="btn primary full">
              Resolve cart issue to continue
            </button>
          ) : (
            <Link
              to={`/checkout${promo ? `?promo=${promo}` : ""}`}
              className="btn primary full"
            >
              Continue to checkout
              <ArrowRight size={18} />
            </Link>
          )}
          <div className="checkout-safe">
            <ShieldCheck size={15} />
            Demo checkout · no real charges
          </div>
        </aside>
      </div>
    </>
  );
}
export function CheckoutPage() {
  const { state, products, dispatch } = useStore();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [addressId, setAddressId] = useState(
    state?.addresses.find((a) => a.isDefault)?.id || "",
  );
  const [delivery, setDelivery] = useState("standard");
  const [payment, setPayment] = useState("Demo card");
  const [promo, setPromo] = useState(params.get("promo") || "");
  const [code, setCode] = useState(promo);
  const [form, setForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(createId());
  useEffect(() => {
    if (!state?.addresses.some((a) => a.id === addressId))
      setAddressId(
        state?.addresses.find((a) => a.isDefault)?.id ||
          state?.addresses[0]?.id ||
          "",
      );
  }, [state?.addresses, addressId]);
  if (!state?.cart.length)
    return (
      <Empty
        title="First, find your pair."
        text="Add something to your bag before starting checkout."
      />
    );
  let totals: Totals | undefined;
  let validation = "";
  try {
    totals = quote(state.cart, products, delivery, promo);
  } catch (e) {
    validation = (e as Error).message;
  }
  const address = state.addresses.find((a) => a.id === addressId);
  async function placeOrder() {
    setError("");
    setBusy(true);
    try {
      const next = await dispatch({
        type: "checkout",
        payload: {
          requestId: requestId.current,
          addressId,
          delivery,
          payment,
          promo,
        },
      });
      const order = next.orders.find((o) => o.requestId === requestId.current);
      if (order) navigate(`/orders/${order.id}?success=1`, { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="breadcrumbs">
        <Link to="/cart">
          <ArrowLeft size={15} />
          Your bag
        </Link>
        <span>/</span>
        <span>Checkout</span>
      </div>
      <PageTitle
        eyebrow="ONE STEP CLOSER"
        title="Make them yours."
        description="A complete shopping experience, with simulated payments and no real charges."
      />
      <div className="stepper">
        {["Delivery", "Payment", "Review"].map((label, i) => (
          <button
            key={label}
            className={step >= i + 1 ? "active" : ""}
            disabled={step < i + 1 || busy}
            onClick={() => setStep(i + 1)}
          >
            <b>{step > i + 1 ? <Check size={15} /> : i + 1}</b>
            {label}
          </button>
        ))}
      </div>
      <div className="checkout-layout">
        <div>
          <div className="panel checkout-panel">
            {step === 1 ? (
              <>
                <div className="section-head">
                  <h2>
                    <MapPin size={21} />
                    Where to?
                  </h2>
                  <button
                    className="text-button orange"
                    onClick={() => setForm(true)}
                  >
                    <Plus size={16} />
                    Add address
                  </button>
                </div>
                <div className="address-options">
                  {state.addresses.map((a) => (
                    <label
                      className={`address-option ${addressId === a.id ? "selected" : ""}`}
                      key={a.id}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={addressId === a.id}
                        onChange={() => setAddressId(a.id)}
                      />
                      <div>
                        <strong>
                          {a.label}
                          {a.isDefault && (
                            <span className="tiny-badge">Default</span>
                          )}
                        </strong>
                        <p>
                          {a.name} · {a.phone}
                        </p>
                        <p>
                          {a.line1}, {a.city}, {a.region} {a.postalCode}
                        </p>
                        <small>{a.country}</small>
                      </div>
                    </label>
                  ))}
                </div>
                {!state.addresses.length && (
                  <div className="inline-empty">
                    <p>Give your new pair a place to land.</p>
                    <button
                      className="btn secondary"
                      onClick={() => setForm(true)}
                    >
                      Add delivery address
                    </button>
                  </div>
                )}
                <h3 className="subsection-title">How soon is soon?</h3>
                {shippingOptions.map((o) => (
                  <label
                    className={`delivery-option ${delivery === o.id ? "selected" : ""}`}
                    key={o.id}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      checked={delivery === o.id}
                      onChange={() => setDelivery(o.id)}
                    />
                    <Truck size={22} />
                    <div>
                      <strong>{o.name}</strong>
                      <small>{o.description}</small>
                    </div>
                    <b>
                      {o.id === "standard" && (totals?.subtotal || 0) >= 15000
                        ? "Free"
                        : money(o.price)}
                    </b>
                  </label>
                ))}
              </>
            ) : step === 2 ? (
              <>
                <h2>
                  <CreditCard size={21} />
                  Choose a payment method
                </h2>
                <div className="notice">
                  <ShieldCheck size={19} />
                  <p>
                    All methods are simulated. No real card, bank, or payment
                    details are collected.
                  </p>
                </div>
                {[
                  [
                    "Demo card",
                    "Visa ending in 4242 · simulated card",
                    CreditCard,
                  ],
                  [
                    "Demo wallet",
                    `${money(state.wallet.balance)} in demo credit`,
                    Wallet,
                  ],
                  [
                    "Cash on delivery",
                    "Simulate payment at your doorstep",
                    ShoppingBag,
                  ],
                ].map(([name, desc, Icon]) => {
                  const I = Icon as typeof Wallet;
                  return (
                    <label
                      className={`delivery-option ${payment === name ? "selected" : ""}`}
                      key={String(name)}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={payment === name}
                        onChange={() => setPayment(String(name))}
                      />
                      <I size={22} />
                      <div>
                        <strong>{String(name)}</strong>
                        <small>{String(desc)}</small>
                      </div>
                    </label>
                  );
                })}
                <p className="muted">
                  Need demo credit?{" "}
                  <Link to="/wallet" className="text-link orange">
                    Visit your wallet
                  </Link>
                </p>
              </>
            ) : (
              <>
                <h2>
                  <PackageIcon />
                  One last look.
                </h2>
                <div className="review-address">
                  <MapPin size={20} />
                  <div>
                    <strong>{address?.name}</strong>
                    <p>
                      {address?.line1}, {address?.city}
                    </p>
                    <p>
                      {address?.region} {address?.postalCode},{" "}
                      {address?.country}
                    </p>
                  </div>
                  <button className="text-button" onClick={() => setStep(1)}>
                    Edit
                  </button>
                </div>
                <div className="review-payment">
                  <CreditCard size={20} />
                  <span>{payment}</span>
                  <span className="muted">
                    {shippingOptions.find((o) => o.id === delivery)?.name}
                  </span>
                  <button className="text-button" onClick={() => setStep(2)}>
                    Edit
                  </button>
                </div>
                {totals?.items.map((p) => (
                  <div className="mini-order-item" key={lineKey(p)}>
                    <img src={p.image} alt={p.name} />
                    <div>
                      <strong>{p.name}</strong>
                      <small>
                        Size {p.size} · Qty {p.quantity}
                      </small>
                    </div>
                    <b>{money(p.price * p.quantity)}</b>
                  </div>
                ))}
              </>
            )}
            <ErrorText error={error || validation} />
            <div className="checkout-navigation">
              {step > 1 && (
                <button
                  className="btn secondary"
                  onClick={() => setStep(step - 1)}
                  disabled={busy}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  className="btn primary"
                  disabled={!address || !!validation}
                  onClick={() => {
                    setStep(step + 1);
                    setError("");
                  }}
                >
                  Continue to {step === 1 ? "payment" : "review"}
                  <ArrowRight size={17} />
                </button>
              ) : (
                <button
                  className="btn primary"
                  onClick={placeOrder}
                  disabled={busy || !!validation}
                >
                  <LockKeyhole size={17} />
                  {busy ? "Placing your order…" : "Place demo order"}
                </button>
              )}
            </div>
          </div>
        </div>
        <aside className="order-summary">
          <h2>Order summary</h2>
          <div className="mini-summary-images">
            {totals?.items.slice(0, 4).map((p) => (
              <img key={lineKey(p)} src={p.image} alt={p.name} />
            ))}
          </div>
          <p className="muted">
            {state.cart.reduce((s, l) => s + l.quantity, 0)} carefully chosen
            pairs
          </p>
          <div className="summary-lines">
            <p>
              <span>Subtotal</span>
              <strong>{money(totals?.subtotal || 0)}</strong>
            </p>
            <p>
              <span>Delivery</span>
              <strong>
                {totals?.shipping ? money(totals.shipping) : "Free"}
              </strong>
            </p>
            {!!totals?.discount && (
              <p className="green">
                <span>Savings</span>
                <strong>−{money(totals.discount)}</strong>
              </p>
            )}
          </div>
          <form
            className="promo-form"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                quote(state.cart, products, delivery, code);
                setPromo(code.toUpperCase());
                setError("");
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            <Tag size={16} />
            <input
              aria-label="Checkout promo code"
              placeholder="Promo code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button>Apply</button>
          </form>
          {promo && (
            <div className="applied-code">
              {promo}
              <button
                aria-label="Remove discount"
                onClick={() => {
                  setPromo("");
                  setCode("");
                }}
              >
                ×
              </button>
            </div>
          )}
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(totals?.total || 0)}</strong>
          </div>
          <p className="muted tiny">USD · No additional demo taxes</p>
          <div className="checkout-safe">
            <LockKeyhole size={15} />
            No money will be charged
          </div>
        </aside>
      </div>
      {form && <AddressForm onClose={() => setForm(false)} />}
    </>
  );
}
function PackageIcon() {
  return <ShoppingBag size={21} />;
}
