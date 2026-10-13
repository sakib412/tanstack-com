/**
 * The shopping cart, kept in the BROWSER: product ids and quantities only.
 *
 * Why not a cookie: a cookie the browser refuses (blocked cookies, an embedded
 * preview) silently empties the cart. localStorage works there, and if even
 * that is blocked the cart lives in memory for the visit.
 *
 * Prices are never stored here. The cart page and checkout send these ids to a
 * server function that prices them from the database (`src/lib/cart.ts`), and
 * checkout prices them again inside the order transaction.
 */
import {useSyncExternalStore} from 'react';

import {MAX_CART_LINES, MAX_LINE_QUANTITY} from './store';

export interface CartItem {
  productId: number;
  quantity: number;
}

const KEY = 'site_cart_v1';
const EMPTY: Array<CartItem> = [];

let memory: Array<CartItem> = EMPTY;
let snapshot: Array<CartItem> | null = null;
const listeners = new Set<() => void>();

/** Keeps only well-formed lines, merged, capped. */
function sanitize(value: unknown): Array<CartItem> {
  if (!Array.isArray(value)) {
    return EMPTY;
  }
  const merged = new Map<number, number>();
  for (const raw of value) {
    const productId = Number((raw as CartItem)?.productId);
    const quantity = Number((raw as CartItem)?.quantity);
    if (Number.isInteger(productId) && productId > 0 && Number.isInteger(quantity) && quantity > 0) {
      merged.set(productId, Math.min(MAX_LINE_QUANTITY, (merged.get(productId) ?? 0) + quantity));
    }
  }
  return [...merged]
    .slice(0, MAX_CART_LINES)
    .map(([productId, quantity]) => ({productId, quantity}));
}

function load(): Array<CartItem> {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw === null ? memory : sanitize(JSON.parse(raw));
  } catch {
    return memory; // Storage blocked or corrupt: fall back to this visit's cart.
  }
}

function save(items: Array<CartItem>) {
  memory = items;
  snapshot = items;
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(KEY);
    } else {
      window.localStorage.setItem(KEY, JSON.stringify(items));
    }
  } catch {
    // Storage blocked: the in-memory cart still works for this visit.
  }
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the cart.
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) {
      snapshot = null;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): Array<CartItem> {
  if (snapshot === null) {
    snapshot = load();
  }
  return snapshot;
}

/** The cart's items, or `null` until the browser has read them (SSR, hydration). */
export function useCartItems(): Array<CartItem> | null {
  return useSyncExternalStore<Array<CartItem> | null>(subscribe, getSnapshot, () => null);
}

/** Item count for the header badge; 0 until hydrated. */
export function useCartCount(): number {
  const items = useCartItems();
  return items ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;
}

export const cart = {
  items(): Array<CartItem> {
    return getSnapshot();
  },

  /** Adds `quantity`, capped per line and by `max` (e.g. stock). Returns the new line quantity. */
  add(productId: number, quantity: number, max = MAX_LINE_QUANTITY): number {
    const items = getSnapshot();
    const existing = items.find(item => item.productId === productId);
    if (!existing && items.length >= MAX_CART_LINES) {
      throw new Error(`Your cart holds at most ${MAX_CART_LINES} different products.`);
    }
    const cap = Math.max(1, Math.min(MAX_LINE_QUANTITY, max));
    const next = Math.min(cap, (existing?.quantity ?? 0) + Math.max(1, Math.trunc(quantity)));
    save(
      existing
        ? items.map(item => (item.productId === productId ? {productId, quantity: next} : item))
        : [...items, {productId, quantity: next}]
    );
    return next;
  },

  /** Sets a line's quantity; 0 removes it. */
  set(productId: number, quantity: number) {
    const q = Math.min(MAX_LINE_QUANTITY, Math.max(0, Math.trunc(quantity) || 0));
    const items = getSnapshot();
    save(
      q === 0
        ? items.filter(item => item.productId !== productId)
        : items.map(item => (item.productId === productId ? {productId, quantity: q} : item))
    );
  },

  /** Drops lines whose product is no longer sold. */
  keepOnly(productIds: Set<number>) {
    const items = getSnapshot();
    const kept = items.filter(item => productIds.has(item.productId));
    if (kept.length !== items.length) {
      save(kept);
    }
  },

  clear() {
    save(EMPTY);
  },
};
