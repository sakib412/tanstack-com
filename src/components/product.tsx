import {Link} from '@tanstack/react-router';
import {useState} from 'react';

import {cart} from '../lib/cart-store';
import type {Product} from '../lib/shop';
import {formatMoney} from '../lib/store';
import {CartIcon, CheckIcon} from './icons';

/** Product photo, or a tinted tile with the product's initial. */
export function ProductImage({product, className}: {product: Product; className?: string}) {
  const classes = ['s-media', className].filter(Boolean).join(' ');
  return product.imageUrl ? (
    <img className={classes} src={product.imageUrl} alt={product.name} loading="lazy" />
  ) : (
    <span className={`${classes} s-media-empty`} aria-hidden="true">
      <span>{product.name.trim().charAt(0).toUpperCase()}</span>
    </span>
  );
}

export function StockPill({stock}: {stock: number}) {
  if (stock <= 0) {
    return <span className="s-pill s-pill-neutral">Out of stock</span>;
  }
  if (stock <= 5) {
    return <span className="s-pill s-pill-warn">Only {stock} left</span>;
  }
  return <span className="s-pill s-pill-success">In stock</span>;
}

/**
 * Adds to the browser cart (`cart-store.ts`). Instant: no server round trip —
 * prices are looked up when the cart or checkout is opened.
 */
export function AddToCartButton({
  product,
  quantity = 1,
  size = 'md',
  block = false,
  onAdded,
}: {
  product: Product;
  quantity?: number;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  onAdded?: () => void;
}) {
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const classes = ['s-btn', 's-btn-primary', `s-btn-${size}`, block && 's-btn-block']
    .filter(Boolean)
    .join(' ');

  if (product.stock <= 0) {
    return (
      <button type="button" className={classes} disabled>
        Sold out
      </button>
    );
  }

  function add() {
    setError(null);
    try {
      const before = cart.items().find(item => item.productId === product.id)?.quantity ?? 0;
      const after = cart.add(product.id, quantity, product.stock);
      if (after === before) {
        setError(`You already have all ${product.stock} in your cart.`);
        return;
      }
      setAdded(true);
      onAdded?.();
      setTimeout(() => setAdded(false), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add to cart.');
    }
  }

  return (
    <>
      <button
        type="button"
        className={classes}
        data-state={added ? 'added' : 'idle'}
        onClick={add}
        aria-live="polite"
      >
        {added ? <CheckIcon size={18} /> : <CartIcon size={18} />}
        <span>{added ? 'Added' : 'Add to cart'}</span>
      </button>
      {error && (
        <p className="s-field-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

export function ProductCard({product}: {product: Product}) {
  return (
    <article className="s-card s-product-card">
      <Link to="/shop/$slug" params={{slug: product.slug}} className="s-product-link">
        <div className="s-product-media">
          <ProductImage product={product} />
          {product.stock > 0 && product.stock <= 5 && (
            <span className="s-pill s-pill-warn s-media-tag">Only {product.stock} left</span>
          )}
          {product.stock <= 0 && (
            <span className="s-pill s-pill-neutral s-media-tag">Sold out</span>
          )}
        </div>
        <div className="s-product-body">
          <h3 className="s-product-name">{product.name}</h3>
          {product.description && <p className="s-product-blurb">{product.description}</p>}
        </div>
      </Link>
      <div className="s-product-foot">
        <span className="s-price">{formatMoney(product.priceCents)}</span>
        <AddToCartButton product={product} size="sm" />
      </div>
    </article>
  );
}
