import {createFileRoute, Link, useNavigate} from '@tanstack/react-router';
import {type FormEvent, type ReactNode, useState} from 'react';

import {CheckoutSteps} from '../components/checkout-steps';
import {ArrowLeftIcon, CartIcon, WalletIcon} from '../components/icons';
import {OrderSummary} from '../components/order-summary';
import {Alert, CartSkeleton, EmptyState, PageHeader} from '../components/store-ui';
import {type CheckoutDetails, placeOrder} from '../lib/cart';
import {cart as cartStore} from '../lib/cart-store';
import {usePricedCart} from '../lib/use-priced-cart';
import {formatMoney} from '../lib/store';
import {pageTitle} from '../lib/title';

export const Route = createFileRoute('/checkout')({
  head: ({matches}) => ({
    meta: [{title: pageTitle(matches, 'Checkout')}, {name: 'robots', content: 'noindex'}],
  }),
  component: Checkout,
});

const EMPTY: CheckoutDetails = {
  name: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postalCode: '',
  country: '',
  note: '',
};

type FieldProps = {
  label: string;
  name: keyof CheckoutDetails;
  form: CheckoutDetails;
  onChange: (name: keyof CheckoutDetails, value: string) => void;
  required?: boolean;
  maxLength: number;
  autoComplete?: string;
  type?: string;
  className?: string;
};

function Field({
  label,
  name,
  form,
  onChange,
  required = true,
  maxLength,
  autoComplete,
  type = 'text',
  className,
}: FieldProps) {
  const id = `checkout-${name}`;
  return (
    <div className={className ? `s-field ${className}` : 's-field'}>
      <label htmlFor={id} className="s-field-label">
        {label}
        {!required && <span className="s-optional">Optional</span>}
      </label>
      <input
        id={id}
        className="s-input"
        type={type}
        name={name}
        value={form[name]}
        onChange={event => onChange(name, event.target.value)}
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
      />
    </div>
  );
}

function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="s-card s-form-section">
      <header>
        <span className="s-form-step">{step}</span>
        <div>
          <h2 className="s-card-title">{title}</h2>
          <p className="s-muted s-small">{description}</p>
        </div>
      </header>
      <div className="s-form-grid">{children}</div>
    </section>
  );
}

function Checkout() {
  // The cart lives in the browser; prices come from the server.
  const {cart, loading, error: cartError} = usePricedCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<CheckoutDetails>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(name: keyof CheckoutDetails, value: string) {
    setForm(current => ({...current, [name]: value}));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const order = await placeOrder({data: {items: cartStore.items(), details: form}});
      cartStore.clear();
      await navigate({to: '/orders/$publicId', params: {publicId: order.publicId}, replace: true});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place the order.');
      setBusy(false);
    }
  }

  const empty = cart !== null && cart.lines.length === 0;

  return (
    <main className="store">
      <PageHeader
        crumbs={[{label: 'Home', to: '/'}, {label: 'Cart', to: '/cart'}, {label: 'Checkout'}]}
        title="Checkout"
        aside={cart && !empty ? <CheckoutSteps current={1} /> : undefined}
      />

      <div className="s-wrap s-section">
        {!cart ? (
          cartError ? <Alert>{cartError}</Alert> : <CartSkeleton />
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
            Add something to your cart to check out.
          </EmptyState>
        ) : (
          <form className="s-checkout-grid" onSubmit={onSubmit}>
            <fieldset className="s-checkout-main" disabled={busy}>
              <FormSection step={1} title="Contact" description="We’ll call this number about delivery.">
                <Field label="Full name" name="name" form={form} onChange={update} maxLength={120} autoComplete="name" />
                <Field label="Phone" name="phone" type="tel" form={form} onChange={update} maxLength={40} autoComplete="tel" />
              </FormSection>

              <FormSection step={2} title="Delivery address" description="Where should we bring your order?">
                <Field label="Street address" name="addressLine1" className="s-span-2" form={form} onChange={update} maxLength={200} autoComplete="address-line1" />
                <Field label="Apartment, suite, etc." name="addressLine2" className="s-span-2" required={false} form={form} onChange={update} maxLength={200} autoComplete="address-line2" />
                <Field label="City" name="city" form={form} onChange={update} maxLength={100} autoComplete="address-level2" />
                <Field label="Postal code" name="postalCode" form={form} onChange={update} maxLength={20} autoComplete="postal-code" />
                <Field label="Country" name="country" className="s-span-2" form={form} onChange={update} maxLength={80} autoComplete="country-name" />
                <div className="s-field s-span-2">
                  <label htmlFor="checkout-note" className="s-field-label">
                    Order note <span className="s-optional">Optional</span>
                  </label>
                  <textarea
                    id="checkout-note"
                    className="s-input"
                    rows={3}
                    maxLength={500}
                    value={form.note}
                    onChange={event => update('note', event.target.value)}
                    placeholder="Delivery instructions, gate code…"
                  />
                </div>
              </FormSection>

              <FormSection step={3} title="Payment" description="No card needed.">
                <div className="s-radio-card s-span-2" data-checked="true">
                  <WalletIcon size={20} />
                  <div>
                    <strong>Pay on delivery</strong>
                    <span className="s-muted s-small">
                      Pay {formatMoney(cart.subtotalCents)} when your order arrives. Nothing is
                      charged now.
                    </span>
                  </div>
                  <span className="s-radio-dot" aria-hidden="true" />
                </div>
              </FormSection>

              <Link to="/cart" className="s-link-muted">
                <ArrowLeftIcon size={16} /> Return to cart
              </Link>
            </fieldset>

            <OrderSummary
              lines={cart.lines}
              subtotalCents={cart.subtotalCents}
              count={cart.count}
              showLines
            >
              {error && <Alert>{error}</Alert>}
              <button
                className="s-btn s-btn-primary s-btn-lg s-btn-block"
                type="submit"
                disabled={busy || loading}
              >
                {busy ? 'Placing order…' : 'Place order'}
              </button>
              <p className="s-fineprint">
                By placing your order you agree to pay {formatMoney(cart.subtotalCents)} on delivery.
              </p>
            </OrderSummary>
          </form>
        )}
      </div>
    </main>
  );
}
