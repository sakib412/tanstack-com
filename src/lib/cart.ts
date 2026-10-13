/**
 * Cart pricing and checkout, through server functions.
 *
 * The cart itself lives in the browser (`cart-store.ts`) as product ids and
 * quantities. These functions receive those ids and price them from the
 * database — the browser never supplies a price — and checkout prices them
 * again inside the order transaction.
 */
import {createServerFn} from '@tanstack/react-start';

import type {Order, Product} from '../server/site-api';
import type {CartItem} from './cart-store';
import {errorOf, siteApi} from './site-api-client';
import {MAX_CART_LINES, MAX_LINE_QUANTITY} from './store';

export interface CartLine {
  product: Product;
  quantity: number;
  lineTotalCents: number;
}

export interface Cart {
  lines: Array<CartLine>;
  count: number;
  subtotalCents: number;
}

export interface CheckoutDetails {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
  note: string;
}

/** Untrusted input from the browser: whole numbers only, merged and capped. */
function toItems(value: unknown): Array<CartItem> {
  const merged = new Map<number, number>();
  for (const raw of Array.isArray(value) ? value : []) {
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

/** Prices the browser's cart. Inactive or unknown products are left out. */
export const priceCart = createServerFn({method: 'POST'})
  .validator((input: {items: Array<CartItem>}) => ({items: toItems(input?.items)}))
  .handler(async ({data}): Promise<Cart> => {
    if (data.items.length === 0) {
      return {lines: [], count: 0, subtotalCents: 0};
    }
    const res = await (await siteApi()).products.lookup.$post({
      json: {ids: data.items.map(item => item.productId)},
    });
    if (!res.ok) {
      throw new Error(await errorOf(res));
    }
    const {products} = await res.json();
    const byId = new Map(products.map(product => [product.id, product]));
    // Keep the shopper's order of lines.
    const lines = data.items.flatMap(item => {
      const product = byId.get(item.productId);
      return product
        ? [{product, quantity: item.quantity, lineTotalCents: product.priceCents * item.quantity}]
        : [];
    });
    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0),
    };
  });

/** Places the order. The caller empties the browser cart on success. */
export const placeOrder = createServerFn({method: 'POST'})
  .validator((input: {items: Array<CartItem>; details: CheckoutDetails}) => {
    const details = (input?.details ?? {}) as Partial<CheckoutDetails>;
    const text = (value: unknown) => String(value ?? '');
    return {
      items: toItems(input?.items),
      details: {
        name: text(details.name),
        phone: text(details.phone),
        addressLine1: text(details.addressLine1),
        addressLine2: text(details.addressLine2),
        city: text(details.city),
        postalCode: text(details.postalCode),
        country: text(details.country),
        note: text(details.note),
      },
    };
  })
  .handler(async ({data}): Promise<Order> => {
    if (data.items.length === 0) {
      throw new Error('Your cart is empty.');
    }
    const {details} = data;
    const res = await (await siteApi()).orders.checkout.$post({
      json: {
        items: data.items,
        customer: {
          customerName: details.name,
          phone: details.phone,
          addressLine1: details.addressLine1,
          addressLine2: details.addressLine2 || null,
          city: details.city,
          postalCode: details.postalCode,
          country: details.country,
          note: details.note || null,
        },
      },
    });
    if (!res.ok) {
      throw new Error(await errorOf(res));
    }
    return (await res.json()).order;
  });
