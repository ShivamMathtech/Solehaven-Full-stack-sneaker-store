import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  MapPin,
  Package,
  RotateCw,
  Star,
  Truck,
} from "lucide-react";
import { orderStatuses } from "../../shared/catalog.mjs";
import { lineKey, money } from "../../shared/store.mjs";
import { isDemo, useStore } from "../lib/store";
import { AccountNav } from "../components/Layout";
import {
  dateText,
  Empty,
  ErrorText,
  Modal,
  PageTitle,
  statusText,
} from "../components/UI";
import type { Order } from "../types";
export function OrdersPage() {
  const { state } = useStore();
  const [tab, setTab] = useState("All");
  const orders =
    state?.orders.filter(
      (o) =>
        tab === "All" ||
        (tab === "Active" && !["delivered", "cancelled"].includes(o.status)) ||
        (tab === "Completed" && o.status === "delivered") ||
        (tab === "Cancelled" && o.status === "cancelled"),
    ) || [];
  return (
    <>
      <PageTitle
        eyebrow="EVERY PAIR HAS A STORY"
        title="Your orders."
        description="From the first click to the first step. Follow every pair here."
      />
      <AccountNav />
      <div className="category-tabs">
        {["All", "Active", "Completed", "Cancelled"].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {orders.length ? (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-card-top">
                <div>
                  <strong>{order.id}</strong>
                  <small>
                    Placed {dateText(order.date)} ·{" "}
                    {order.items.reduce((s, l) => s + l.quantity, 0)} items
                  </small>
                </div>
                <span className={`status ${order.status}`}>
                  {statusText(order.status)}
                </span>
              </div>
              <div className="order-card-middle">
                <div className="order-images">
                  {order.items.slice(0, 4).map((p) => (
                    <img key={lineKey(p)} src={p.image} alt={p.name} />
                  ))}
                </div>
                <div>
                  <p>{order.items.map((p) => p.name).join(", ")}</p>
                  <span className="muted">{order.payment}</span>
                </div>
                <strong>{money(order.total)}</strong>
              </div>
              <div className="order-card-bottom">
                <span className="muted">
                  {order.status === "delivered"
                    ? "A good pair, a great arrival."
                    : order.status === "cancelled"
                      ? "Cancelled before dispatch."
                      : "Your next move is in the making."}
                </span>
                <Link to={`/orders/${order.id}`} className="text-link orange">
                  {order.status === "delivered"
                    ? "Order details & review"
                    : "Track your order"}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="No orders here just yet."
          text="Your next favorite pair is waiting in the collection."
        />
      )}
    </>
  );
}
function downloadReceipt(order: Order) {
  const text = [
    "SOLEHAVEN — DEMO RECEIPT",
    "No money was charged. This is not a tax invoice.",
    `Order: ${order.id}`,
    `Placed: ${dateText(order.date)}`,
    `Status: ${statusText(order.status)}`,
    "",
    ...order.items.map(
      (p) =>
        `${p.name} | US ${p.size} | ${p.quantity} × ${money(p.price)} = ${money(p.price * p.quantity)}`,
    ),
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `Savings: ${money(order.discount)}`,
    `Delivery: ${money(order.shipping)}`,
    `Total: ${money(order.total)}`,
    `Payment: ${order.payment}`,
    "",
    `Deliver to: ${order.address.name}`,
    order.address.line1,
    `${order.address.city}, ${order.address.region} ${order.address.postalCode}`,
    order.address.country,
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${order.id}-demo-receipt.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function OrderPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { state, dispatch, toast, refresh } = useStore();
  const [cancel, setCancel] = useState(false);
  const [review, setReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const order = state?.orders.find((o) => o.id === id);
  if (!order)
    return (
      <Empty
        title="We couldn’t find that order."
        text="Your order history has all the details."
        to="/orders"
        label="Back to your orders"
      />
    );
  const current = orderStatuses.indexOf(order.status);
  const reviewed = state?.reviews.some((r) => r.orderId === order.id);
  async function act(type: string, payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      await dispatch({ type, payload });
      setCancel(false);
      setReview(false);
      toast(
        type === "reviewOrder"
          ? "Thanks for sharing your experience."
          : "Your order is updated.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="breadcrumbs">
        <Link to="/orders">
          <ArrowLeft size={15} />
          Your orders
        </Link>
        <span>/</span>
        <span>{order.id}</span>
      </div>
      {params.has("success") && (
        <div className="order-success">
          <CheckCircle2 size={40} />
          <div>
            <p className="eyebrow">GOOD CHOICE. GREAT SOLES.</p>
            <h2>You’re all set!</h2>
            <p>Your demo order is confirmed. No money was charged.</p>
          </div>
          <button
            className="icon-btn"
            aria-label="Dismiss order confirmation"
            onClick={() => setParams({})}
          >
            ×
          </button>
        </div>
      )}
      <PageTitle
        eyebrow="THE JOURNEY TO YOUR DOOR"
        title={`Order ${order.id}`}
        description={`Placed ${dateText(order.date)} · ${order.payment}`}
      >
        <button
          className="btn secondary"
          onClick={() => downloadReceipt(order)}
        >
          <Download size={16} />
          Receipt
        </button>
      </PageTitle>
      <div className="checkout-layout">
        <div>
          <div className="panel">
            <div className="section-head">
              <h2>Your pair is on a journey.</h2>
              <span className={`status ${order.status}`}>
                {statusText(order.status)}
              </span>
            </div>
            {order.status === "cancelled" ? (
              <p className="notice">
                This order was cancelled before dispatch. Any demo wallet credit
                has been returned.
              </p>
            ) : (
              <ol className="tracking-timeline">
                {orderStatuses.map((status, i) => (
                  <li className={i <= current ? "complete" : ""} key={status}>
                    <span className="timeline-dot">
                      {i <= current ? <Check size={16} /> : i + 1}
                    </span>
                    <div>
                      <strong>{statusText(status)}</strong>
                      <small>
                        {order.history.find((h) => h.status === status)
                          ? dateText(
                              order.history.find((h) => h.status === status)!
                                .date,
                            )
                          : "Waiting for this step"}
                      </small>
                    </div>
                    {i === current && (
                      <span className="tiny-badge">Current</span>
                    )}
                  </li>
                ))}
              </ol>
            )}
            {isDemo && !["cancelled", "delivered"].includes(order.status) && (
              <div className="demo-controls">
                <p>
                  Try the journey. Advance this demo order one step at a time.
                </p>
                <button
                  className="btn secondary"
                  disabled={busy}
                  onClick={() => act("advanceOrder", { id: order.id })}
                >
                  <Truck size={17} />
                  Simulate next tracking step
                </button>
              </div>
            )}
            {!isDemo && (
              <button className="btn secondary" onClick={() => void refresh()}>
                <RotateCw size={17} />
                Refresh order status
              </button>
            )}
            <ErrorText error={error} />
          </div>
          <div className="panel order-items">
            <h2>Good things inside.</h2>
            {order.items.map((p) => (
              <div className="mini-order-item" key={lineKey(p)}>
                <Link to={`/product/${p.productId}`}>
                  <img src={p.image} alt={p.name} />
                </Link>
                <div>
                  <strong>{p.name}</strong>
                  <small>
                    {p.color} · US {p.size} · Qty {p.quantity}
                  </small>
                </div>
                <b>{money(p.price * p.quantity)}</b>
              </div>
            ))}
            <div className="order-actions">
              {["confirmed", "processing"].includes(order.status) && (
                <button
                  className="text-button danger"
                  onClick={() => setCancel(true)}
                >
                  Cancel this order
                </button>
              )}
              {order.status === "delivered" && (
                <button
                  className="btn primary"
                  disabled={reviewed}
                  onClick={() => setReview(true)}
                >
                  <Star size={16} />
                  {reviewed
                    ? "Review submitted"
                    : "How was your pair? Leave a review"}
                </button>
              )}
              <Link className="text-link" to="/shop">
                Find your next favorite
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
        <aside className="order-summary">
          <h2>Order details</h2>
          <div className="address-detail">
            <MapPin size={20} />
            <div>
              <h4>{order.address.label}</h4>
              <strong>{order.address.name}</strong>
              <p>
                {order.address.line1}
                <br />
                {order.address.city}, {order.address.region}{" "}
                {order.address.postalCode}
                <br />
                {order.address.country}
              </p>
            </div>
          </div>
          <div className="summary-lines">
            <p>
              <span>Subtotal</span>
              <strong>{money(order.subtotal)}</strong>
            </p>
            <p>
              <span>Delivery</span>
              <strong>{money(order.shipping)}</strong>
            </p>
            <p>
              <span>Discount</span>
              <strong>−{money(order.discount)}</strong>
            </p>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(order.total)}</strong>
          </div>
          <p className="payment-caption">
            <CreditCard size={16} />
            {order.payment}
          </p>
        </aside>
      </div>
      {cancel && (
        <Modal title="Cancel this order?" onClose={() => setCancel(false)}>
          <p>
            Your order hasn’t shipped yet. Any demo wallet payment will be
            returned to your wallet.
          </p>
          <ErrorText error={error} />
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setCancel(false)}>
              Keep my order
            </button>
            <button
              className="btn primary"
              disabled={busy}
              onClick={() => act("cancelOrder", { id: order.id })}
            >
              Yes, cancel order
            </button>
          </div>
        </Modal>
      )}
      {review && (
        <Modal title="How’s your new pair?" onClose={() => setReview(false)}>
          <div className="review-illustration">
            <Package size={42} />
          </div>
          <p className="center muted">Share a little of your experience.</p>
          <div className="rating-picker" role="group" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                aria-pressed={rating === n}
                key={n}
                onClick={() => setRating(n)}
              >
                <Star size={32} fill={n <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <label className="form-label">
            Your review
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              minLength={3}
              maxLength={1000}
              placeholder="The fit, the comfort, the first impression…"
              rows={4}
            />
          </label>
          <ErrorText error={error} />
          <button
            className="btn primary full"
            disabled={busy || comment.trim().length < 3}
            onClick={() =>
              act("reviewOrder", { orderId: order.id, rating, comment })
            }
          >
            Share your review
          </button>
        </Modal>
      )}
    </>
  );
}
