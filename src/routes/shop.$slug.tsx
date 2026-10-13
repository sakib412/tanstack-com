import {createFileRoute, Link, notFound} from '@tanstack/react-router';
import {useState} from 'react';

import {LinkIcon, ShieldIcon, WalletIcon} from '../components/icons';
import {AddToCartButton, ProductImage, StockPill} from '../components/product';
import {QuantityStepper} from '../components/quantity';
import {Breadcrumbs} from '../components/store-ui';
import {getProduct} from '../lib/shop';
import {formatMoney, MAX_LINE_QUANTITY} from '../lib/store';
import {pageTitle} from '../lib/title';

export const Route = createFileRoute('/shop/$slug')({
  loader: async ({params}) => {
    const product = await getProduct({data: {slug: params.slug}});
    if (!product) {
      throw notFound();
    }
    return {product};
  },
  head: ({loaderData, matches}) => {
    const product = loaderData?.product;
    return {
      meta: [
        {title: pageTitle(matches, product?.name ?? 'Product')},
        ...(product?.description ? [{name: 'description', content: product.description}] : []),
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const {product} = Route.useLoaderData();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const max = Math.min(MAX_LINE_QUANTITY, product.stock);

  return (
    <main className="store">
      <div className="s-wrap s-section">
        <Breadcrumbs
          items={[{label: 'Home', to: '/'}, {label: 'Shop', to: '/shop'}, {label: product.name}]}
        />

        <div className="s-pdp">
          <div className="s-pdp-media">
            <ProductImage product={product} className="s-media-xl" />
          </div>

          <div className="s-pdp-info">
            <h1 className="s-title">{product.name}</h1>
            <div className="s-pdp-price-row">
              <span className="s-price s-price-xl">{formatMoney(product.priceCents)}</span>
              <StockPill stock={product.stock} />
            </div>

            {product.description && <p className="s-pdp-description">{product.description}</p>}

            <div className="s-divider" />

            {product.stock > 0 ? (
              <div className="s-pdp-buy">
                <div className="s-field-label">Quantity</div>
                <div className="s-pdp-buy-row">
                  <QuantityStepper value={quantity} min={1} max={max} onChange={setQuantity} />
                  <AddToCartButton
                    product={product}
                    quantity={quantity}
                    size="lg"
                    block
                    onAdded={() => setAdded(true)}
                  />
                </div>
                {added && (
                  <div className="s-inline-success" role="status">
                    Added to your cart.{' '}
                    <Link to="/cart" className="s-link">
                      View cart
                    </Link>
                    {' · '}
                    <Link to="/checkout" className="s-link">
                      Check out
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <AddToCartButton product={product} size="lg" block />
            )}

            <ul className="s-assurances">
              <li>
                <WalletIcon size={18} />
                <div>
                  <strong>Pay on delivery</strong>
                  <span>Nothing is charged online.</span>
                </div>
              </li>
              <li>
                <ShieldIcon size={18} />
                <div>
                  <strong>Live stock</strong>
                  <span>Stock is checked again when you place your order.</span>
                </div>
              </li>
              <li>
                <LinkIcon size={18} />
                <div>
                  <strong>Private order link</strong>
                  <span>Track your order from its confirmation page.</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
