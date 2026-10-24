import { useState, useEffect } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  Footprints,
  Heart,
  Home,
  Search,
  ShoppingBag,
  User,
  Compass,
  Package,
  Wallet,
  MapPin,
} from "lucide-react";
import { isDemo, useStore } from "../lib/store";
export function Layout() {
  const { state, error, persistenceWarning, refresh } = useStore();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const count = state?.cart.reduce((s, p) => s + p.quantity, 0) || 0;
  const unread =
    state?.notifications.filter(
      (n) => !n.read && (n.id !== "welcome" || state.preferences.offers),
    ).length || 0;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="topline">
        <span>Good shoes. Better days.</span>
        <span>
          Free standard delivery on orders $150+ <ArrowUpRight size={12} />
        </span>
      </div>
      <header className="header">
        <div className="header-main container">
          <Link to="/" className="wordmark">
            <span className="logo">
              <Footprints size={22} />
            </span>
            solehaven<span className="logo-dot">.</span>
          </Link>
          <form
            className="searchbox"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/shop?q=${encodeURIComponent(query)}`);
            }}
          >
            <Search size={18} />
            <input
              aria-label="Search shoes"
              placeholder="Find your next favorite pair..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>↵</kbd>
          </form>
          <div className="header-actions">
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="icon-btn notification-link"
            >
              <Bell size={21} />
              {unread > 0 && <i />}
            </Link>
            <Link
              to="/wishlist"
              aria-label="Wishlist"
              className="icon-btn desktop-only"
            >
              <Heart size={21} />
            </Link>
            <Link to="/account" aria-label="My account" className="avatar">
              {state?.profile.name.slice(0, 1).toUpperCase() || (
                <User size={18} />
              )}
            </Link>
            <Link
              to="/cart"
              className="bag-button"
              aria-label={`Shopping bag, ${count} items`}
            >
              <ShoppingBag size={19} />
              <span className="desktop-only">Bag</span>
              <b>{count}</b>
            </Link>
          </div>
        </div>
        <div className="nav-wrap">
          <div className="container nav-inner">
            <nav className="main-nav" aria-label="Main navigation">
              <NavLink to="/" end>
                Discover
              </NavLink>
              <NavLink to="/shop" end>
                All sneakers
              </NavLink>
              <Link to="/shop?gender=Men">Men</Link>
              <Link to="/shop?gender=Women">Women</Link>
              <Link to="/shop?new=1">
                New arrivals <i className="nav-dot" />
              </Link>
              <Link to="/shop?sale=1" className="sale-link">
                Sale
              </Link>
            </nav>
            <Link to="/about" className="mode-tag">
              <span />
              {isDemo ? "Interactive demo" : "Store preview"}
              <ChevronDown size={12} />
            </Link>
          </div>
        </div>
      </header>
      {error && (
        <div className="container alert" role="alert">
          API connection: {error}{" "}
          <button onClick={() => void refresh()} className="text-button">
            Retry
          </button>
        </div>
      )}
      {persistenceWarning && (
        <div className="container alert">{persistenceWarning}</div>
      )}
      <main id="main-content" className="container main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container footer-top">
          <div>
            <Link to="/" className="wordmark">
              solehaven<span className="logo-dot">.</span>
            </Link>
            <p>Made for your next move.</p>
          </div>
          <nav aria-label="Footer navigation">
            <Link to="/shop">The collection</Link>
            <Link to="/orders">Your orders</Link>
            <Link to="/about">Help & demo guide</Link>
          </nav>
          <span className="footer-note">
            A little style. A lot of sole.
            <ArrowUpRight size={18} />
          </span>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Solehaven. Concept store.</span>
          <span>
            {isDemo
              ? "Demo orders · saved in this browser · no real charges"
              : "Store preview · all payments are simulated"}
          </span>
        </div>
      </footer>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {[
          ["/", Home, "Home"],
          ["/shop", Compass, "Explore"],
          ["/cart", ShoppingBag, "Bag"],
          ["/wishlist", Heart, "Saved"],
          ["/account", User, "Account"],
        ].map(([to, Icon, label]) => {
          const I = Icon as typeof Home;
          return (
            <NavLink key={String(to)} to={String(to)} end>
              <I size={21} />
              <span>
                {String(label)}
                {label === "Bag" && count > 0 ? ` (${count})` : ""}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
export function AccountNav() {
  return (
    <nav className="account-nav" aria-label="Account sections">
      {[
        ["/account", User, "Profile"],
        ["/orders", Package, "Orders"],
        ["/wallet", Wallet, "Wallet"],
        ["/addresses", MapPin, "Addresses"],
        ["/wishlist", Heart, "Wishlist"],
      ].map(([to, Icon, label]) => {
        const I = Icon as typeof User;
        return (
          <NavLink key={String(to)} to={String(to)} end>
            <I size={17} />
            {String(label)}
          </NavLink>
        );
      })}
    </nav>
  );
}
