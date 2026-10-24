import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, Heart, Plus, Star, ShoppingBag } from "lucide-react";
import { money } from "../../shared/store.mjs";
import type { Product } from "../types";
import { useStore } from "../lib/store";
import { ErrorText, Modal } from "./UI";
export function ProductCard({ product }: { product: Product }) {
  const { state, dispatch, toast } = useStore();
  const navigate = useNavigate();
  const [quick, setQuick] = useState(false);
  const saved = state?.wishlist.includes(product.id);
  async function favorite() {
    if (!state) return navigate("/login");
    try {
      await dispatch({
        type: "toggleWishlist",
        payload: { productId: product.id },
      });
      toast(saved ? "Removed from your wishlist" : "Saved to your wishlist");
    } catch (e) {
      toast((e as Error).message);
    }
  }
  return (
    <article className="product-card">
      <div className="product-image">
        <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
          <img
            src={product.image}
            alt={`${product.name} in ${product.color}`}
            loading="lazy"
          />
        </Link>
        {product.badge && (
          <span className={`badge ${product.badge === "Sale" ? "sale" : ""}`}>
            {product.badge}
          </span>
        )}
        <button
          className={`favorite ${saved ? "active" : ""}`}
          aria-label={`${saved ? "Remove" : "Save"} ${product.name} ${saved ? "from" : "to"} wishlist`}
          aria-pressed={Boolean(saved)}
          onClick={favorite}
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
        <button
          className="quick-add"
          onClick={() => setQuick(true)}
          aria-label={`Choose size for ${product.name}`}
        >
          <Plus size={19} />
        </button>
      </div>
      <div className="product-meta">
        <span>
          {product.brand} · {product.category}
        </span>
        <span className="rating">
          <Star size={12} fill="currentColor" />
          {product.rating.toFixed(1)}
        </span>
      </div>
      <Link to={`/product/${product.id}`} className="product-name">
        {product.name}
        <ArrowUpRight size={16} />
      </Link>
      <div className="product-bottom">
        <span>
          <strong>{money(product.price)}</strong>
          {product.oldPrice && <del>{money(product.oldPrice)}</del>}
        </span>
        <span
          className="color-dot"
          style={{ background: product.colorHex }}
          title={product.color}
        />
      </div>
      {quick && <QuickAdd product={product} onClose={() => setQuick(false)} />}
    </article>
  );
}
export function QuickAdd({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { state, dispatch, toast } = useStore();
  const navigate = useNavigate();
  const [size, setSize] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function add() {
    if (!state) {
      onClose();
      navigate("/login");
      return;
    }
    if (!size) {
      setError("Choose your size first.");
      return;
    }
    setBusy(true);
    try {
      await dispatch({
        type: "addToCart",
        payload: { productId: product.id, size, quantity: 1 },
      });
      toast(`${product.name} added to your bag`);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Your perfect fit" onClose={onClose}>
      <img
        className="quick-product-image"
        src={product.image}
        alt={product.name}
      />
      <div className="section-head">
        <h3>{product.name}</h3>
        <strong>{money(product.price)}</strong>
      </div>
      <p className="muted">{product.color} · US sizing</p>
      <div className="size-picker" role="group" aria-label="Choose US size">
        {product.sizes.map((n) => (
          <button
            key={n}
            className={size === n ? "selected" : ""}
            aria-pressed={size === n}
            onClick={() => {
              setSize(n);
              setError("");
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <ErrorText error={error} />
      <button
        className="btn primary full"
        disabled={busy || product.stock === 0}
        onClick={add}
      >
        <ShoppingBag size={18} />
        {busy ? "Adding…" : "Add to bag"}
      </button>
    </Modal>
  );
}
