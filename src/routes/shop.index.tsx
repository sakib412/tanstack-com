import {createFileRoute} from '@tanstack/react-router';
import {useMemo, useState} from 'react';

import {BagIcon, SearchIcon} from '../components/icons';
import {ProductCard} from '../components/product';
import {Alert, EmptyState, PageHeader} from '../components/store-ui';
import {listProducts, type Product} from '../lib/shop';
import {pageTitle} from '../lib/title';
import {useSite} from './__root';

type Sort = 'newest' | 'price-asc' | 'price-desc' | 'name';

const SORTS: Array<{value: Sort; label: string}> = [
  {value: 'newest', label: 'Newest'},
  {value: 'price-asc', label: 'Price: low to high'},
  {value: 'price-desc', label: 'Price: high to low'},
  {value: 'name', label: 'Name: A–Z'},
];

export const Route = createFileRoute('/shop/')({
  loader: async () => await listProducts({data: {}}),
  head: ({matches}) => ({meta: [{title: pageTitle(matches, 'Shop')}]}),
  component: Shop,
});

function sortProducts(products: Array<Product>, sort: Sort): Array<Product> {
  const sorted = [...products];
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.priceCents - b.priceCents);
    case 'price-desc':
      return sorted.sort((a, b) => b.priceCents - a.priceCents);
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted; // The API already returns newest first.
  }
}

function Shop() {
  const {products, error} = Route.useLoaderData();
  const site = useSite();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [inStockOnly, setInStockOnly] = useState(false);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = products.filter(
      product =>
        (!inStockOnly || product.stock > 0) &&
        (!needle ||
          product.name.toLowerCase().includes(needle) ||
          product.description.toLowerCase().includes(needle))
    );
    return sortProducts(filtered, sort);
  }, [products, query, sort, inStockOnly]);

  return (
    <main className="store">
      <PageHeader
        crumbs={[{label: 'Home', to: '/'}, {label: 'Shop'}]}
        title="Shop"
        subtitle={`Official merchandise from ${site?.name ?? 'the community'}.`}
      />

      <div className="s-wrap s-section">
        {error ? (
          <Alert>{error}</Alert>
        ) : products.length === 0 ? (
          <EmptyState icon={<BagIcon size={28} />} title="No products yet">
            New products are on their way — check back soon.
          </EmptyState>
        ) : (
          <>
            <div className="s-toolbar">
              <label className="s-search">
                <SearchIcon size={18} />
                <input
                  type="search"
                  placeholder="Search products"
                  aria-label="Search products"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                />
              </label>
              <div className="s-toolbar-controls">
                <label className="s-check">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={event => setInStockOnly(event.target.checked)}
                  />
                  <span>In stock only</span>
                </label>
                <label className="s-select">
                  <span className="s-visually-hidden">Sort by</span>
                  <select value={sort} onChange={event => setSort(event.target.value as Sort)}>
                    {SORTS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <p className="s-result-count" aria-live="polite">
              {visible.length === products.length
                ? `${products.length} product${products.length === 1 ? '' : 's'}`
                : `${visible.length} of ${products.length} products`}
            </p>

            {visible.length === 0 ? (
              <EmptyState icon={<SearchIcon size={28} />} title="No matching products">
                Try a different search or clear the filters.
              </EmptyState>
            ) : (
              <div className="s-product-grid">
                {visible.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
