import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Heart,
  PackageCheck,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Truck,
  X,
} from "lucide-react";
import { brands, categories } from "../../shared/catalog.mjs";
import { money } from "../../shared/store.mjs";
import { useStore } from "../lib/store";
import { ProductCard } from "../components/ProductCard";
import { Empty, ErrorText, Modal, PageTitle } from "../components/UI";
import { AccountNav } from "../components/Layout";
export function HomePage() {
  const { products } = useStore();
  const [category, setCategory] = useState("All");
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="tiny-dot" />
            THE EVERYDAY COLLECTION — 2026
          </span>
          <h1>
            Good things
            <br />
            start with
            <br />
            <em>great soles.</em>
          </h1>
          <p>
            A little more comfort. A lot more you.
            <br />
            Find the pair that takes you places.
          </p>
          <Link to="/shop" className="btn dark">
            Find your pair
            <ArrowUpRight size={19} />
          </Link>
          <div className="hero-bottom">
            <div className="mini-avatars">
              <span>J</span>
              <span>A</span>
              <span>M</span>
            </div>
            <div>
              <span className="stars">★★★★★</span>
              <small>A collection made for every day</small>
            </div>
          </div>
        </div>
        <div className="hero-art">
          <span className="hero-outline">MOVE</span>
          <img
            src="/images/hero.jpg"
            alt="White and orange sneaker from the everyday collection"
            fetchPriority="high"
          />
          <div className="hero-product">
            <span>
              <small>THE EVERYDAY FAVORITE</small>
              <strong>Nike Air Motion</strong>
            </span>
            <Link to="/product/1" className="hero-price">
              $129 <ArrowUpRight size={18} />
            </Link>
          </div>
          <span className="hero-stamp">
            FRESH
            <br />
            PERSPECTIVE
            <br />
            <ArrowUpRight size={25} />
          </span>
        </div>
        <div className="hero-index">
          <span>01</span>
          <i />
          <span>THE NEW EDIT</span>
        </div>
      </section>
      <div className="benefits">
        <span>
          <Truck />
          <span>
            <strong>A smooth delivery</strong>
            <small>Free standard shipping over $150</small>
          </span>
        </span>
        <span>
          <RotateCcw />
          <span>
            <strong>Find your perfect fit</strong>
            <small>Size guide on every product</small>
          </span>
        </span>
        <span>
          <ShieldCheck />
          <span>
            <strong>Try the whole experience</strong>
            <small>Demo checkout. No real charges.</small>
          </span>
        </span>
      </div>
      <section className="brand-section">
        <span className="eyebrow">
          THE LABELS YOU KNOW.
          <br />
          THE STYLES YOU’LL LOVE.
        </span>
        <Link to="/shop?brand=Nike" className="brand-logo brand-0">
          Nike<span>↗</span>
        </Link>
        <Link to="/shop?brand=Puma" className="brand-logo brand-3">
          Puma
        </Link>
        <Link to="/shop?category=Running" className="brand-logo brand-2">
          Run club.
        </Link>
        <Link to="/shop?category=Lifestyle" className="brand-logo brand-2">
          Everyday.
        </Link>
      </section>
      <section className="home-products">
        <div className="section-head">
          <div>
            <p className="eyebrow orange">GOOD TASTE STARTS HERE</p>
            <h2>Your next favorites.</h2>
          </div>
          <Link to="/shop" className="text-link">
            View the collection
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="category-tabs">
          {categories.map((c) => (
            <button
              key={c}
              className={category === c ? "selected" : ""}
              onClick={() => setCategory(c)}
            >
              {c === "All" ? "All sneakers" : c}
            </button>
          ))}
          <span className="muted">Picked for your everyday</span>
        </div>
        <div className="product-grid">
          {products
            .filter((p) => category === "All" || p.category === category)
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>
      <section className="editorial-banner">
        <div>
          <p className="eyebrow">A FRESH START, ON US</p>
          <h2>
            Your first pair.
            <br />A little less ordinary.
          </h2>
          <p>
            Take 10% off your next demo order with <strong>WELCOME10</strong>.
          </p>
          <Link to="/shop" className="btn white">
            Make your move
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="discount-art" aria-hidden="true">
          <span>10</span>
          <div>
            %
            <small>
              OFF YOUR
              <br />
              NEXT PAIR
            </small>
          </div>
          <i>GOOD SOLES CLUB ↗</i>
        </div>
      </section>
      <section className="new-section">
        <div className="section-head">
          <div>
            <p className="eyebrow orange">JUST LANDED</p>
            <h2>Fresh on the shelf.</h2>
          </div>
          <Link to="/shop?new=1" className="text-link">
            All new arrivals
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {products
            .filter((p) => p.badge === "New")
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>
      <div className="closing-line">
        <span>Find your stride.</span>
        <Footnote />
        <span>Make it yours.</span>
      </div>
    </>
  );
}
function Footnote() {
  return <span className="closing-symbol">✳</span>;
}
export function ShopPage() {
  const { products, loading } = useStore();
  const [params, setParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(
    () => window.matchMedia("(min-width: 601px)").matches,
  );
  const q = params.get("q") || "",
    brand = params.get("brand") || "All brands",
    category = params.get("category") || "All",
    gender = params.get("gender") || "All",
    max = Number(params.get("max") || 200),
    sort = params.get("sort") || "featured",
    size = params.get("size") || "",
    rating = params.get("rating") === "1";
  function set(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  let filtered = products.filter(
    (p) =>
      `${p.name} ${p.brand} ${p.category} ${p.color}`
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (brand === "All brands" || p.brand === brand) &&
      (category === "All" || p.category === category) &&
      (gender === "All" || p.gender === gender || p.gender === "Unisex") &&
      p.price <= max * 100 &&
      (!size || p.sizes.includes(Number(size))) &&
      (!rating || p.rating >= 4.8) &&
      (!params.get("new") || p.badge === "New") &&
      (!params.get("sale") || p.badge === "Sale"),
  );
  if (sort === "price-low") filtered.sort((a, b) => a.price - b.price);
  if (sort === "price-high") filtered.sort((a, b) => b.price - a.price);
  if (sort === "rating") filtered.sort((a, b) => b.rating - a.rating);
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
  const filters = (
    <>
      <div className="filter-group">
        <h3>Category</h3>
        {categories.map((c) => (
          <label className="check-line" key={c}>
            <input
              type="radio"
              name="category"
              checked={category === c}
              onChange={() => set("category", c === "All" ? "" : c)}
            />
            {c === "All" ? "All sneakers" : c}
            <span>
              {products.filter((p) => c === "All" || p.category === c).length}
            </span>
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h3>Brand</h3>
        {brands.map((b) => (
          <label className="check-line" key={b}>
            <input
              type="radio"
              name="brand"
              checked={brand === b}
              onChange={() => set("brand", b === "All brands" ? "" : b)}
            />
            {b}
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h3>
          Price range <span>Up to {money(max * 100)}</span>
        </h3>
        <input
          aria-label="Maximum price"
          type="range"
          min="50"
          max="200"
          step="5"
          value={max}
          onChange={(e) => set("max", e.target.value)}
        />
        <div className="range-labels">
          <span>$50</span>
          <span>$200</span>
        </div>
      </div>
      <div className="filter-group">
        <h3>Shopping for</h3>
        <div className="filter-pills">
          {["All", "Men", "Women"].map((g) => (
            <button
              className={gender === g ? "selected" : ""}
              key={g}
              onClick={() => set("gender", g === "All" ? "" : g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <h3>Size (US)</h3>
        <div className="size-filter">
          {[6, 7, 8, 9, 10, 11, 12].map((s) => (
            <button
              key={s}
              className={size === String(s) ? "selected" : ""}
              onClick={() => set("size", size === String(s) ? "" : String(s))}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <label className="check-line">
        <input
          type="checkbox"
          checked={rating}
          onChange={(e) => set("rating", e.target.checked ? "1" : "")}
        />
        Rated 4.8 and up <Star size={13} />
      </label>
      <button
        className="btn secondary full filter-reset"
        onClick={() => setParams({})}
      >
        <RotateCcw size={15} />
        Clear all filters
      </button>
    </>
  );
  return (
    <>
      <PageTitle
        eyebrow="THE SOLEHAVEN COLLECTION"
        title={
          params.get("new")
            ? "New arrivals."
            : params.get("sale")
              ? "Good pairs. Great prices."
              : "Find your kind of sole."
        }
        description="From your first coffee to your last mile. A pair for every part of your day."
      />
      <div className="catalog-layout">
        <aside className="filters">
          <details
            open={filterOpen}
            onToggle={(e) => setFilterOpen(e.currentTarget.open)}
          >
            <summary>
              <SlidersHorizontal size={18} />
              Filters<span>Refine your fit</span>
            </summary>
            {filters}
          </details>
        </aside>
        <section>
          <div className="catalog-toolbar">
            <span>
              {loading ? "Loading collection…" : `${filtered.length} sneakers`}
              {q && ` for “${q}”`}
            </span>
            <label>
              Sort by{" "}
              <select
                aria-label="Sort products"
                value={sort}
                onChange={(e) => set("sort", e.target.value)}
              >
                <option value="featured">Recommended</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="rating">Highest rated</option>
                <option value="name">Name: A to Z</option>
              </select>
            </label>
          </div>
          <div className="catalog-search">
            <Search size={18} />
            <input
              aria-label="Search this collection"
              value={q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Search the collection"
            />
            {q && (
              <button
                className="icon-btn"
                onClick={() => set("q", "")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {filtered.length ? (
            <div className="product-grid shop-grid">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <h2>No pairs found.</h2>
              <p>Try a different search or give your filters a fresh start.</p>
              <button className="btn primary" onClick={() => setParams({})}>
                Reset filters
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
export function ProductPage() {
  const { id } = useParams();
  const { products, state, dispatch, toast } = useStore();
  const navigate = useNavigate();
  const product = products.find((p) => p.id === Number(id));
  const [size, setSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [guide, setGuide] = useState(false);
  const [zoom, setZoom] = useState(false);
  if (!product)
    return (
      <Empty
        title="This pair stepped out."
        text="Explore the collection to find something else you love."
      />
    );
  const saved = state?.wishlist.includes(product.id);
  const reviews =
    state?.reviews.filter((r) => r.productIds.includes(product.id)) || [];
  async function add() {
    if (!state) return navigate("/login");
    if (!size) {
      setError("Please select a size.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await dispatch({
        type: "addToCart",
        payload: { productId: product!.id, size, quantity },
      });
      toast("Added to your bag. Looking good!");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="breadcrumbs">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Sneakers</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>
      <section className="product-detail">
        <div className="detail-media">
          <button
            className="detail-main-image"
            onClick={() => setZoom(true)}
            aria-label={`Enlarge ${product.name} photo`}
          >
            <img src={product.image} alt={product.name} />
            <span className="badge">
              {product.badge || "The everyday edit"}
            </span>
            <span className="zoom-hint">
              Click to take a closer look <Search size={16} />
            </span>
          </button>
          <div className="detail-note">
            <PackageCheck size={17} />
            <span>Curated for comfort. Chosen for you.</span>
          </div>
        </div>
        <div className="detail-info">
          <p className="eyebrow orange">
            {product.brand} / {product.category}
          </p>
          <h1>{product.name}</h1>
          <div className="detail-rating">
            <span className="stars">★★★★★</span>
            <strong>{product.rating}</strong>
            <span className="muted">Collection rating</span>
          </div>
          <div className="detail-price">
            {money(product.price)}
            {product.oldPrice && <del>{money(product.oldPrice)}</del>}
          </div>
          <p className="detail-description">{product.description}</p>
          <div className="color-selection">
            <h4>
              Color <span>{product.color}</span>
            </h4>
            <span
              className="color-option"
              style={{ background: product.colorHex }}
            >
              <Check size={16} />
            </span>
          </div>
          <div className="section-head small-head">
            <h4>
              Select size <span className="muted">(US)</span>
            </h4>
            <button className="text-button" onClick={() => setGuide(true)}>
              Size guide ↗
            </button>
          </div>
          <div className="size-picker">
            {product.sizes.map((s) => (
              <button
                key={s}
                className={s === size ? "selected" : ""}
                aria-pressed={s === size}
                aria-label={`Size ${s}`}
                onClick={() => {
                  setSize(s);
                  setError("");
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="stock-note">
            <span />
            {product.stock > 0
              ? `${product.stock} pairs available`
              : "Currently sold out"}{" "}
            · Regular fit
          </p>
          <ErrorText error={error} />
          <div className="add-row">
            <div className="quantity-control">
              <button
                aria-label="Decrease quantity"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity === 1}
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                aria-label="Increase quantity"
                onClick={() => setQuantity(Math.min(9, quantity + 1))}
                disabled={quantity === 9}
              >
                +
              </button>
            </div>
            <button
              className="btn primary"
              onClick={add}
              disabled={busy || product.stock === 0}
            >
              <ShoppingBag size={18} />
              {busy ? "Adding…" : "Add to bag"}
            </button>
            <button
              className={`icon-btn outline ${saved ? "orange" : ""}`}
              aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
              aria-pressed={Boolean(saved)}
              onClick={async () => {
                if (!state) return navigate("/login");
                try {
                  await dispatch({
                    type: "toggleWishlist",
                    payload: { productId: product.id },
                  });
                } catch (e) {
                  toast((e as Error).message);
                }
              }}
            >
              <Heart size={21} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="detail-promises">
            <p>
              <Truck size={17} />
              Free standard delivery on orders over $150
            </p>
            <p>
              <ShieldCheck size={17} />
              Demo payments — no real card details needed
            </p>
          </div>
          <details className="accordion" open>
            <summary>The finer details</summary>
            <ul>
              {product.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </details>
          <details className="accordion">
            <summary>Reviews ({reviews.length})</summary>
            {reviews.length ? (
              reviews.map((r) => (
                <div className="review" key={r.id}>
                  <span className="stars">{"★".repeat(r.rating)}</span>
                  <p>{r.comment}</p>
                </div>
              ))
            ) : (
              <p className="muted">
                Your story starts here. Review this pair after a delivered demo
                order.
              </p>
            )}
          </details>
        </div>
      </section>
      <section className="new-section">
        <div className="section-head">
          <h2>A few more good soles.</h2>
          <Link className="text-link" to="/shop">
            View all
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {products
            .filter((p) => p.id !== product.id)
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>
      {guide && (
        <Modal title="Find your fit" onClose={() => setGuide(false)}>
          <p className="muted">
            Approximate unisex guide for this concept collection. Actual brand
            sizing may vary.
          </p>
          <table className="size-table">
            <thead>
              <tr>
                <th>US</th>
                <th>UK</th>
                <th>EU</th>
                <th>Foot length</th>
              </tr>
            </thead>
            <tbody>
              {[
                [6, 5, 38.5, 24],
                [7, 6, 40, 25],
                [8, 7, 41, 26],
                [9, 8, 42.5, 27],
                [10, 9, 44, 28],
                [11, 10, 45, 29],
                [12, 11, 46, 30],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((c, i) => (
                    <td key={i}>
                      {c}
                      {i === 3 ? " cm" : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Measure from heel to longest toe. Between sizes? Consider the larger
            size.
          </p>
        </Modal>
      )}
      {zoom && (
        <Modal title={product.name} onClose={() => setZoom(false)} wide>
          <img className="zoom-image" src={product.image} alt={product.name} />
        </Modal>
      )}
    </>
  );
}
export function WishlistPage() {
  const { state, products } = useStore();
  return (
    <>
      <PageTitle
        eyebrow="KEEP THE GOOD ONES CLOSE"
        title="Your wishlist."
        description={`${state?.wishlist.length || 0} pairs worth coming back for.`}
      />
      <AccountNav />
      {state?.wishlist.length ? (
        <div className="product-grid">
          {products
            .filter((p) => state.wishlist.includes(p.id))
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      ) : (
        <Empty
          title="A little room for favorites."
          text="Tap the heart on a pair you love, and we’ll keep it right here."
        />
      )}
    </>
  );
}
