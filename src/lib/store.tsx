import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { products as seedProducts } from "../../shared/catalog.mjs";
import { initialState, reduceStore } from "../../shared/store.mjs";
import type { Action, Product, Store } from "../types";
export const isDemo = import.meta.env.VITE_DATA_MODE !== "api";
const KEY = "solehaven.demo.v1";
const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
interface Context {
  state: Store | null;
  products: Product[];
  loading: boolean;
  error: string;
  persistenceWarning: string;
  dispatch: (action: Action) => Promise<Store>;
  login: (
    data: { name?: string; email: string; password?: string },
    register?: boolean,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  toast: (message: string) => void;
}
const Ctx = createContext<Context | null>(null);
export const useStore = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Missing store");
  return ctx;
};
function readDemo(): Store {
  try {
    const text = localStorage.getItem(KEY);
    if (text) {
      const s = JSON.parse(text);
      if (
        s.version === 1 &&
        s.profile &&
        Array.isArray(s.cart) &&
        Array.isArray(s.orders) &&
        Array.isArray(s.wishlist) &&
        Array.isArray(s.addresses) &&
        Array.isArray(s.notifications) &&
        Array.isArray(s.reviews) &&
        s.wallet &&
        s.preferences
      )
        return s;
    }
  } catch {
    /* Recover a missing or damaged browser demo. */
  }
  return initialState() as Store;
}
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Store | null>(() =>
    isDemo ? readDemo() : null,
  );
  const current = useRef(state);
  const csrf = useRef("");
  const queue = useRef(Promise.resolve());
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState("");
  const [persistenceWarning, setPersistenceWarning] = useState("");
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function toast(text: string) {
    setMessage(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 4500);
  }
  async function request(path: string, data?: unknown) {
    const response = await fetch(`${BASE}${path}`, {
      method: data === undefined ? "GET" : "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf.current,
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
      signal: AbortSignal.timeout(12000),
    });
    const body = await response
      .json()
      .catch(() => ({
        error: "The API returned an invalid response. Check VITE_API_URL.",
      }));
    if (!response.ok) throw new Error(body.error || "Request failed.");
    return body;
  }
  function update(value: Store | null) {
    current.current = value;
    setState(value);
    if (isDemo && value) {
      try {
        localStorage.setItem(KEY, JSON.stringify(value));
      } catch {
        setPersistenceWarning(
          "Browser storage is unavailable. Changes will last only until you leave this page.",
        );
      }
    }
  }
  async function refresh() {
    if (isDemo) return;
    setLoading(true);
    setError("");
    try {
      const [catalog, session] = await Promise.all([
        request("/products"),
        request("/session"),
      ]);
      setProducts(catalog.products);
      csrf.current = session.csrf || "";
      update(session.state);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to connect to the backend.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!isDemo) void refresh();
    else update(current.current);
    const listener = (event: StorageEvent) => {
      if (isDemo && event.key === KEY) {
        const next = readDemo();
        current.current = next;
        setState(next);
      }
    };
    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener("storage", listener);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []); // Mode is fixed at build time.
  function dispatch(action: Action): Promise<Store> {
    const task = queue.current.then(async () => {
      if (!current.current) throw new Error("Please sign in to continue.");
      if (isDemo) {
        const next = reduceStore(current.current, action, products, {
          demo: true,
        }) as Store;
        update(next);
        return next;
      }
      const data = await request("/actions", action);
      update(data.state);
      if (data.products) setProducts(data.products);
      return data.state as Store;
    });
    queue.current = task.then(
      () => undefined,
      () => undefined,
    );
    return task;
  }
  async function login(
    data: { name?: string; email: string; password?: string },
    register = false,
  ) {
    if (isDemo) {
      const next = reduceStore(
        current.current || initialState(),
        {
          type: "updateProfile",
          payload: {
            name: data.name || data.email.split("@")[0],
            email: data.email,
            phone: current.current?.profile.phone || "",
          },
        },
        products,
        { demo: true },
      ) as Store;
      update(next);
    } else {
      const result = await request(
        register ? "/auth/register" : "/auth/login",
        data,
      );
      csrf.current = result.csrf;
      update(result.state);
      setError("");
    }
  }
  async function logout() {
    if (isDemo) {
      toast(
        "Demo mode uses one local profile. Reset it in Settings when you’re ready.",
      );
      return;
    }
    await request("/auth/logout", {});
    csrf.current = "";
    update(null);
  }
  const value: Context = {
    state,
    products,
    loading,
    error,
    persistenceWarning,
    dispatch,
    login,
    logout,
    refresh,
    reset: () => {
      update(initialState() as Store);
      toast("Demo reset. Your fresh start is ready.");
    },
    changePassword: async (currentPassword, newPassword) => {
      await request("/auth/password", { currentPassword, newPassword });
    },
    toast,
  };
  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className={`toast ${message ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </Ctx.Provider>
  );
}
