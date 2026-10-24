export interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice: number | null;
  image: string;
  color: string;
  colorHex: string;
  badge: string;
  rating: number;
  stock: number;
  gender: string;
  sizes: number[];
  description: string;
  details: string[];
}
export interface CartLine {
  productId: number;
  size: number;
  quantity: number;
}
export interface Address {
  id: string;
  label: string;
  name: string;
  line1: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}
export interface Order {
  id: string;
  requestId: string;
  date: string;
  status: string;
  items: (Product & CartLine)[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  address: Address;
  payment: string;
  delivery: string;
  promo: string;
  history: { status: string; date: string }[];
}
export interface Store {
  version: number;
  profile: { name: string; email: string; phone: string };
  cart: CartLine[];
  wishlist: number[];
  addresses: Address[];
  orders: Order[];
  reviews: {
    id: string;
    orderId: string;
    productIds: number[];
    rating: number;
    comment: string;
    date: string;
  }[];
  wallet: {
    balance: number;
    transactions: { id: string; title: string; amount: number; date: string }[];
  };
  preferences: { orderUpdates: boolean; offers: boolean };
  notifications: {
    id: string;
    title: string;
    message: string;
    date: string;
    read: boolean;
  }[];
}
export interface Action {
  type: string;
  payload?: Record<string, unknown>;
}
