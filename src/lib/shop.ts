/**
 * The catalogue and orders, through server functions — pages never call an API
 * themselves. Each calls the Site API in-process; see `site-api-client.ts`.
 */
import {createServerFn} from '@tanstack/react-start';

import type {Order, Product} from '../server/site-api';
import {errorOf, siteApi} from './site-api-client';

export type {Order, Product};

export interface ProductList {
  products: Array<Product>;
  /** Set when the catalogue could not be read (e.g. the Site Database is off). */
  error: string | null;
}

export const listProducts = createServerFn({method: 'GET'})
  .validator((input: {limit?: number} | undefined) => ({limit: Number(input?.limit ?? 100)}))
  .handler(async ({data}): Promise<ProductList> => {
    const res = await (await siteApi()).products.$get({query: {limit: String(data.limit)}});
    if (!res.ok) {
      return {products: [], error: await errorOf(res)};
    }
    return {products: (await res.json()).products, error: null};
  });

/** One active product, or `null` (the route renders its 404). */
export const getProduct = createServerFn({method: 'GET'})
  .validator((input: {slug: string}) => ({slug: String(input.slug)}))
  .handler(async ({data}): Promise<Product | null> => {
    const res = await (await siteApi()).products[':slug'].$get({param: {slug: data.slug}});
    return res.ok ? (await res.json()).product : null;
  });

/** A customer's order by the id in its confirmation link, or `null`. */
export const getOrder = createServerFn({method: 'GET'})
  .validator((input: {publicId: string}) => ({publicId: String(input.publicId)}))
  .handler(async ({data}): Promise<Order | null> => {
    const res = await (await siteApi()).orders[':publicId'].$get({
      param: {publicId: data.publicId},
    });
    return res.ok ? (await res.json()).order : null;
  });
