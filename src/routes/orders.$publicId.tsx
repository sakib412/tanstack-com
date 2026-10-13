import {createFileRoute, Link, notFound} from '@tanstack/react-router';
import {useState} from 'react';

import {CheckoutSteps} from '../components/checkout-steps';
import {CheckCircleIcon, CheckIcon, LinkIcon, PackageIcon, TruckIcon, WalletIcon} from '../components/icons';
import {Breadcrumbs} from '../components/store-ui';
import {getOrder, type Order} from '../lib/shop';
import {formatMoney} from '../lib/store';
import {pageTitle} from '../lib/title';

/**
 * A customer's order. Reachable only through the unguessable id in its link —
 * there is no order list — so the page is the customer's receipt and tracker.
 */
export const Route = createFileRoute('/orders/$publicId')({
  loader: async ({params}) => {
    const order = await getOrder({data: {publicId: params.publicId}});
    if (!order) {
      throw notFound();
    }
    return {order};
  },
  head: ({matches}) => ({
    meta: [{title: pageTitle(matches, 'Your order')}, {name: 'robots', content: 'noindex'}],
  }),
  component: OrderPage,
});

const TIMELINE = [
  {status: 'pending', label: 'Order received', icon: PackageIcon},
  {status: 'paid', label: 'Paid', icon: WalletIcon},
  {status: 'shipped', label: 'Shipped', icon: TruckIcon},
] as const;

function OrderTimeline({status}: {status: Order['status']}) {
  if (status === 'cancelled') {
    return <p className="s-alert s-alert-danger">This order was cancelled.</p>;
  }
  const reached = TIMELINE.findIndex(step => step.status === status);
  return (
    <ol className="s-timeline" aria-label="Order status">
      {TIMELINE.map((step, index) => {
        const Icon = index <= reached ? CheckIcon : step.icon;
        return (
          <li key={step.status} data-state={index <= reached ? 'done' : 'todo'}>
            <span className="s-timeline-dot">
              <Icon size={16} />
            </span>
            <span>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the URL bar still has the link.
    }
  }
  return (
    <button type="button" className="s-btn s-btn-secondary s-btn-md" onClick={copy}>
      {copied ? <CheckIcon size={16} /> : <LinkIcon size={16} />}
      <span>{copied ? 'Link copied' : 'Copy order link'}</span>
    </button>
  );
}

function OrderPage() {
  const {order} = Route.useLoaderData();
  const reference = order.publicId.slice(0, 8).toUpperCase();
  const placed = new Date(order.createdAt).toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const address = [
    order.addressLine1,
    order.addressLine2,
    [order.city, order.postalCode].filter(Boolean).join(' '),
    order.country,
  ].filter(Boolean);

  return (
    <main className="store">
      <div className="s-wrap s-section s-wrap-narrow">
        <div className="s-order-top">
          <Breadcrumbs items={[{label: 'Shop', to: '/shop'}, {label: `Order ${reference}`}]} />
          <CheckoutSteps current={3} />
        </div>

        <section className="s-card s-confirmation">
          <span className="s-confirmation-icon">
            <CheckCircleIcon size={32} />
          </span>
          <p className="s-eyebrow">Order {reference}</p>
          <h1 className="s-title">Thank you, {order.customerName.split(' ')[0]}!</h1>
          <p className="s-subtitle">
            Your order has been received. Keep this page’s link — it’s how you check this
            order again.
          </p>
          <div className="s-confirmation-actions">
            <CopyLinkButton />
            <Link className="s-btn s-btn-ghost s-btn-md" to="/shop">
              Continue shopping
            </Link>
          </div>
          <OrderTimeline status={order.status} />
        </section>

        <div className="s-order-grid">
          <section className="s-card">
            <h2 className="s-card-title">
              Items <span className="s-muted">· {itemCount}</span>
            </h2>
            <ul className="s-receipt-lines">
              {order.items.map((item, index) => (
                <li key={index}>
                  <div>
                    <span className="s-receipt-name">{item.name}</span>
                    <span className="s-muted s-small">
                      {item.quantity} × {formatMoney(item.unitPriceCents, order.currency)}
                    </span>
                  </div>
                  <span className="s-num">{formatMoney(item.lineTotalCents, order.currency)}</span>
                </li>
              ))}
            </ul>
            <dl className="s-totals">
              <div className="s-totals-grand">
                <dt>Total due on delivery</dt>
                <dd className="s-num">{formatMoney(order.totalCents, order.currency)}</dd>
              </div>
            </dl>
          </section>

          <section className="s-card s-order-meta">
            <div>
              <h3>Deliver to</h3>
              <p>
                {order.customerName}
                {address.map(line => (
                  <span key={line} className="s-block">
                    {line}
                  </span>
                ))}
                {order.phone && <span className="s-block s-muted">{order.phone}</span>}
              </p>
            </div>
            <div>
              <h3>Payment</h3>
              <p>Pay on delivery</p>
            </div>
            <div>
              <h3>Placed</h3>
              <p>{placed}</p>
            </div>
            {order.note && (
              <div>
                <h3>Note</h3>
                <p>{order.note}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
