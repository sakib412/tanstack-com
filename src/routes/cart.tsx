import {createFileRoute, Link} from '@tanstack/react-router';

import {CheckoutSteps} from '../components/checkout-steps';
import {ArrowLeftIcon, CartIcon, TrashIcon} from '../components/icons';
import {OrderSummary} from '../components/order-summary';
import {ProductImage} from '../components/product';
import {QuantityStepper} from '../components/quantity';
import {Alert, CartSkeleton, EmptyState, PageHeader} from '../components/store-ui';
import type {CartLine} from '../lib/cart';
import {cart as cartStore} from '../lib/cart-store';
import {usePricedCart} from '../lib/use-priced-cart';
import {formatMoney, MAX_LINE_QUANTITY} from '../lib/store';
import {pageTitle} from '../lib/title';

export const Route = createFileRoute('/cart')({
  head: ({matches}) => ({
    meta: [{title: pageTitle(matches, 'Cart')}, {name: 'robots', content: 'noindex'}],
  }),
  component: CartPage,
});

/** A line the shop cannot fill as it stands. */
function shortOf(line: CartLine): boolean {
  return line.quantity > line.product.stock;
}

function CartPage() {
  // The cart lives in the browser; prices come from the server.
  const {cart, loading, error} = usePricedCart();
  const setQuantity = (productId: number, quantity: number) =>
    cartStore.set(productId, quantity);

  const blocked = !cart || loading || cart.lines.some(shortOf);
  const empty = cart !== null && cart.lines.length === 0;

  return (
    <main className="store">
      <PageHeader
        crumbs={[{label: 'Home', to: '/'}, {label: 'Shop', to: '/shop'}, {label: 'Cart'}]}
        title="Shopping cart"
        aside={cart && !empty ? <CheckoutSteps current={0} /> : undefined}
      />

      <div className="s-wrap s-section">
        {!cart ? (
          error ? <Alert>{error}</Alert> : <CartSkeleton />
        ) : empty ? (
          <EmptyState
            icon={<CartIcon size={28} />}
            title="Your cart is empty"
            action={
              <Link className="s-btn s-btn-primary s-btn-md" to="/shop">
                Browse products
              </Link>
            }
          >
            Products you add will appear here.
          </EmptyState>
        ) : (
          <div className="s-checkout-grid">
            <section className="s-card s-cart" aria-label="Cart items">
              <div className="s-cart-head" aria-hidden="true">
                <span>Product</span>
                <span>Quantity</span>
                <span>Total</span>
              </div>
              <ul>
                {cart.lines.map(line => (
                  <li
                    key={line.product.id}
                    className="s-cart-line"
                    data-busy={loading || undefined}
                  >
                    <div className="s-cart-product">
                      <ProductImage product={line.product} className="s-media-row" />
                      <div>
                        <Link
                          to="/shop/$slug"
                          params={{slug: line.product.slug}}
                          className="s-cart-name"
                        >
                          {line.product.name}
                        </Link>
                        <span className="s-muted s-small">
                          {formatMoney(line.product.priceCents)} each
                        </span>
                        {shortOf(line) && (
                          <span className="s-field-error">
                            {line.product.stock > 0
                              ? `Only ${line.product.stock} left — lower the quantity.`
                              : 'Out of stock — remove it to check out.'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="s-cart-qty">
                      <QuantityStepper
                        size="sm"
                        value={line.quantity}
                        min={1}
                        max={Math.max(1, Math.min(MAX_LINE_QUANTITY, line.product.stock))}
                        disabled={loading}
                        onChange={quantity => setQuantity(line.product.id, quantity)}
                      />
                      <button
                        type="button"
                        className="s-icon-btn"
                        aria-label={`Remove ${line.product.name}`}
                        disabled={loading}
                        onClick={() => setQuantity(line.product.id, 0)}
                      >
                        <TrashIcon size={18} />
                      </button>
                    </div>
                    <strong className="s-cart-total s-num">
                      {formatMoney(line.lineTotalCents)}
                    </strong>
                  </li>
                ))}
              </ul>
              <div className="s-cart-foot">
                <Link to="/shop" className="s-link-muted">
                  <ArrowLeftIcon size={16} /> Continue shopping
                </Link>
              </div>
            </section>

            <OrderSummary
              lines={cart.lines}
              subtotalCents={cart.subtotalCents}
              count={cart.count}
            >
              {error && <Alert>{error}</Alert>}
              {blocked ? (
                <button type="button" className="s-btn s-btn-primary s-btn-lg s-btn-block" disabled>
                  {loading ? 'Updating…' : 'Fix the cart to check out'}
                </button>
              ) : (
                <Link className="s-btn s-btn-primary s-btn-lg s-btn-block" to="/checkout">
                  Proceed to checkout
                </Link>
              )}
              <p className="s-fineprint">You pay when your order arrives.</p>
            </OrderSummary>
          </div>
        )}
      </div>
    </main>
  );
}
