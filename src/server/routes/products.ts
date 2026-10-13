/**
 * The catalogue, read-only and public: only ACTIVE products are ever listed.
 * Changing products is store-admin work and is not exposed here.
 */
import {Hono} from 'hono';
import {HTTPException} from 'hono/http-exception';
import {validator} from 'hono/validator';

import type {Product as ProductRow} from '../../generated/prisma/client';
import {MAX_CART_LINES} from '../../lib/store';
import {type DbEnv, withDb} from '../middleware';

export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  stock: number;
}

/** Re-projected field by field: only these reach the browser. */
export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    priceCents: row.priceCents,
    imageUrl: row.imageUrl,
    stock: row.stock,
  };
}

const listQuery = validator('query', (value: Record<string, string | string[]>) => {
  const raw = typeof value.limit === 'string' ? Number(value.limit) : 100;
  const limit = Number.isInteger(raw) ? Math.min(100, Math.max(1, raw)) : 100;
  return {limit};
});

const lookupBody = validator('json', (value: unknown) => {
  const ids = (value as {ids?: unknown} | null)?.ids;
  if (!Array.isArray(ids) || ids.length > MAX_CART_LINES) {
    throw new HTTPException(400, {message: `\`ids\` must be a list of up to ${MAX_CART_LINES}.`});
  }
  return {
    ids: [...new Set(ids)].filter(
      (id): id is number => Number.isInteger(id) && id > 0 && id <= 2_147_483_647
    ),
  };
});

export const products = new Hono<DbEnv>()
  .use(withDb)
  .get('/', listQuery, async c => {
    const {limit} = c.req.valid('query');
    const rows = await c.var.db.product.findMany({
      where: {active: true},
      orderBy: [{createdAt: 'desc'}, {id: 'desc'}],
      take: limit,
    });
    return c.json({products: rows.map(toProduct)});
  })
  // Several products by id, for the cart. Inactive or unknown ids are left out.
  .post('/lookup', lookupBody, async c => {
    const {ids} = c.req.valid('json');
    const rows = ids.length
      ? await c.var.db.product.findMany({where: {id: {in: ids}, active: true}})
      : [];
    return c.json({products: rows.map(toProduct)});
  })
  .get('/:slug', async c => {
    const row = await c.var.db.product.findFirst({
      where: {slug: c.req.param('slug'), active: true},
    });
    if (!row) {
      throw new HTTPException(404, {message: 'Product not found.'});
    }
    return c.json({product: toProduct(row)});
  });
