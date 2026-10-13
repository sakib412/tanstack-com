/**
 * The browser cart, priced by the server. Re-prices whenever the cart changes;
 * keeps showing the last prices while a new request is in flight.
 */
import {useEffect, useState} from 'react';

import {type Cart, priceCart} from './cart';
import {cart as cartStore, useCartItems} from './cart-store';

export interface PricedCart {
  /** `null` until the first prices arrive. */
  cart: Cart | null;
  /** True before the browser has read its cart, or while pricing. */
  loading: boolean;
  error: string | null;
}

export function usePricedCart(): PricedCart {
  const items = useCartItems();
  const key = items ? JSON.stringify(items) : null;
  const [state, setState] = useState<PricedCart>({cart: null, loading: true, error: null});

  useEffect(() => {
    if (key === null || items === null) {
      return;
    }
    if (items.length === 0) {
      setState({cart: {lines: [], count: 0, subtotalCents: 0}, loading: false, error: null});
      return;
    }
    let cancelled = false;
    setState(current => ({...current, loading: true, error: null}));
    priceCart({data: {items}})
      .then(cart => {
        if (cancelled) {
          return;
        }
        // Products that are no longer sold drop out of the cart.
        cartStore.keepOnly(new Set(cart.lines.map(line => line.product.id)));
        setState({cart, loading: false, error: null});
      })
      .catch(err => {
        if (!cancelled) {
          setState(current => ({
            ...current,
            loading: false,
            error: err instanceof Error ? err.message : 'Could not load your cart.',
          }));
        }
      });
    return () => {
      cancelled = true;
    };
    // `key` captures the cart's contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
