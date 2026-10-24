import { Component, type ReactNode } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Footprints,
  Heart,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { isDemo, StoreProvider, useStore } from "./lib/store";
import { Layout } from "./components/Layout";
import { Empty, PageTitle } from "./components/UI";
import { HomePage, ShopPage, ProductPage, WishlistPage } from "./pages/Catalog";
import { CartPage, CheckoutPage } from "./pages/Checkout";
import { OrderPage, OrdersPage } from "./pages/Orders";
import {
  AccountPage,
  AddressesPage,
  LoginPage,
  NotificationsPage,
  WalletPage,
} from "./pages/Account";
function RequireAccount({ children }: { children: ReactNode }) {
  const { state, loading, error, refresh } = useStore();
  const location = useLocation();
  if (loading)
    return (
      <div className="loading-screen">
        <span className="spinner" />
        Getting things ready…
      </div>
    );
  if (error)
    return (
      <div className="empty">
        <h2>We couldn’t reach the store.</h2>
        <p>{error}</p>
        <button className="btn primary" onClick={() => void refresh()}>
          Try again
        </button>
      </div>
    );
  return state ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
}
function AboutPage() {
  return (
    <>
      <PageTitle
        eyebrow="WELCOME TO SOLEHAVEN"
        title="Good soles. Zero pressure."
        description="A complete concept-store experience to explore at your own pace."
      />
      <section className="about-hero">
        <Footprints size={46} />
        <h2>Try the whole journey.</h2>
        <p>
          Find a favorite. Make it yours. Follow it home. Every part of this
          store is designed to be explored, with simulated payments and no real
          purchases.
        </p>
        <Link to="/shop" className="btn dark">
          Let’s find your pair
          <ArrowRight size={18} />
        </Link>
      </section>
      <div className="guide-grid">
        {[
          [
            Heart,
            "Find your favorites",
            "Search and filter the collection, choose a size, and save a pair for later.",
          ],
          [
            ShoppingBag,
            "Make a demo order",
            "Choose your delivery address, apply WELCOME10, and check out with a simulated payment.",
          ],
          [
            Wallet,
            "Try your wallet",
            "Add demo credit and use it at checkout. Refunds for cancelled wallet orders return here.",
          ],
          [
            CheckCircle2,
            "Follow the journey",
            "In demo mode, advance tracking steps, download a receipt, and leave a review after delivery.",
          ],
        ].map(([Icon, title, copy]) => {
          const I = Icon as typeof Heart;
          return (
            <article className="panel" key={String(title)}>
              <I size={26} />
              <h3>{String(title)}</h3>
              <p>{String(copy)}</p>
            </article>
          );
        })}
      </div>
      <section className="panel help-panel">
        <h2>A few good things to know.</h2>
        {[
          [
            "Is this a real store?",
            "This is a functional showcase, not a live retailer. All products, prices, inventory, collection ratings, deliveries, wallet balances, and payment outcomes are illustrative. No items are shipped and no real money changes hands.",
          ],
          [
            "Where is my information saved?",
            isDemo
              ? "In this browser on this device. You can reset the demo from your account. Clearing browser data also clears your demo. Use sample details."
              : "Your account data is saved by the optional backend. Payments and deliveries still remain simulated.",
          ],
          [
            "Which promo codes can I try?",
            "WELCOME10: 10% off, up to $25. STEP20: 20% off orders of $200+, up to $40. FREESHIP: free delivery. One promo code per order.",
          ],
          [
            "How do I cancel or review an order?",
            "Cancel while the order is confirmed or processing. Once delivered, open the order to leave one review. Demo tracking can be advanced manually from the order page.",
          ],
          [
            "What about the product photos?",
            "The collection uses bundled illustrative shoe photography from Unsplash. Product names and colorways are concept labels, not an official brand catalogue. Solehaven is not affiliated with the featured brands.",
          ],
        ].map(([title, copy]) => (
          <details className="accordion" key={title}>
            <summary>{title}</summary>
            <p>{copy}</p>
          </details>
        ))}
      </section>
    </>
  );
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error)
      return (
        <div className="fatal-error">
          <h1>Something tripped us up.</h1>
          <p>
            Reload the page to try again. If local demo data is damaged, reset
            it below.
          </p>
          <button
            className="btn primary"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
          {isDemo && (
            <button
              className="btn secondary"
              onClick={() => {
                try {
                  localStorage.removeItem("solehaven.demo.v1");
                } catch {
                  /* unavailable storage */
                }
                window.location.assign("/");
              }}
            >
              Reset local demo data
            </button>
          )}
        </div>
      );
    return this.props.children;
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="product/:id" element={<ProductPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="about" element={<AboutPage />} />
              {[
                ["wishlist", <WishlistPage />],
                ["cart", <CartPage />],
                ["checkout", <CheckoutPage />],
                ["orders", <OrdersPage />],
                ["orders/:id", <OrderPage />],
                ["account", <AccountPage />],
                ["addresses", <AddressesPage />],
                ["wallet", <WalletPage />],
                ["notifications", <NotificationsPage />],
              ].map(([path, element]) => (
                <Route
                  key={String(path)}
                  path={String(path)}
                  element={<RequireAccount>{element}</RequireAccount>}
                />
              ))}
              <Route
                path="*"
                element={
                  <Empty
                    title="Looks like a wrong turn."
                    text="Let’s get you back to some good soles."
                    to="/"
                    label="Back to home"
                  />
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </ErrorBoundary>
  );
}
