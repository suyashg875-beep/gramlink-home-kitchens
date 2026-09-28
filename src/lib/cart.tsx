import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  sellerId: string;
  sellerName: string;
  stock: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartState | null>(null);
const KEY = "gramlink-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const add: CartState["add"] = (item, qty = 1) =>
    setItems((prev) => {
      const found = prev.find((i) => i.productId === item.productId);
      if (found) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(i.quantity + qty, item.stock) }
            : i,
        );
      }
      return [...prev, { ...item, quantity: Math.min(qty, item.stock) }];
    });

  const setQty = (productId: string, qty: number) =>
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId ? { ...i, quantity: Math.max(0, Math.min(qty, i.stock)) } : i,
        )
        .filter((i) => i.quantity > 0),
    );

  const remove = (productId: string) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const clear = () => setItems([]);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
