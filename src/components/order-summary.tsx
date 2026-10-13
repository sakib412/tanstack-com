import type {ReactNode} from 'react';

import type {CartLine} from '../lib/cart';
import {formatMoney} from '../lib/store';
import {ProductImage} from './product';

/** The right-hand summary card on cart and checkout. */
export function OrderSummary({
  title = 'Order summary',
  lines,
  subtotalCents,
  count,
  showLines = false,
  children,
}: {
  title?: string;
  lines: Array<CartLine>;
  subtotalCents: number;
  count: number;
  showLines?: boolean;
  children?: ReactNode;
}) {
  return (
    <aside className="s-card s-summary">
      <h2 className="s-card-title">{title}</h2>

      {showLines && (
        <ul className="s-summary-items">
          {lines.map(line => (
            <li key={line.product.id}>
              <div className="s-thumb-wrap">
                <ProductImage product={line.product} className="s-media-thumb" />
                <span className="s-thumb-qty">{line.quantity}</span>
              </div>
              <span className="s-summary-name">{line.product.name}</span>
              <span className="s-num">{formatMoney(line.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
      )}

      <dl className="s-totals">
        <div>
          <dt>
            Subtotal · {count} item{count === 1 ? '' : 's'}
          </dt>
          <dd className="s-num">{formatMoney(subtotalCents)}</dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd className="s-muted">Arranged after ordering</dd>
        </div>
        <div className="s-totals-grand">
          <dt>Total due on delivery</dt>
          <dd className="s-num">{formatMoney(subtotalCents)}</dd>
        </div>
      </dl>

      {children}
    </aside>
  );
}
