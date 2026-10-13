/**
 * Checkout and order confirmation.
 *
 * There is deliberately NO public order list: orders carry customers' names and
 * addresses. A customer reaches their own order only through its `publicId`, an
 * unguessable UUID in the confirmation link.
 *
 * Payment is offline (cash on delivery / manual): deployed server code may only
 * reach the community's hostname and the Site Database, so no payment provider.
 */
import {Hono} from 'hono';
import {HTTPException} from 'hono/http-exception';
import {validator} from 'hono/validator';

import type {Prisma} from '../../generated/prisma/client';
import {MAX_CART_LINES, MAX_LINE_QUANTITY, STORE_CURRENCY} from '../../lib/store';
import {type DbEnv, withDb} from '../middleware';
import {parseInteger, parseOptionalText, parseText} from '../validate';

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled';

export interface OrderLine {
  productId: number | null;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

/** A customer's own order, as shown on its confirmation page. */
export interface Order {
  publicId: string;
  status: OrderStatus;
  customerName: string;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  note: string | null;
  items: Array<OrderLine>;
  totalCents: number;
  currency: string;
  createdAt: string;
}

const MAX_CENTS = 2_147_483_647;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type OrderWithItems = Prisma.OrderGetPayload<{include: {items: true}}>;

/** Re-projected field by field: the internal `id` never reaches the browser. */
function toOrder(row: OrderWithItems): Order {
  return {
    publicId: row.publicId,
    status: row.status,
    customerName: row.customerName,
    phone: row.phone,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    postalCode: row.postalCode,
    country: row.country,
    note: row.note,
    items: row.items.map(item => ({
      productId: item.productId,
      name: item.name,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
    })),
    totalCents: row.totalCents,
    currency: row.currency,
    createdAt: row.createdAt.toISOString(),
  };
}

const checkoutBody = validator('json', (value: unknown) => {
  const body = (value ?? {}) as Record<string, unknown>;
  const customer = (body.customer ?? {}) as Record<string, unknown>;

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new HTTPException(400, {message: 'Your cart is empty.'});
  }
  // Merge repeated products into one line.
  const quantities = new Map<number, number>();
  for (const raw of body.items as Array<Record<string, unknown>>) {
    const productId = parseInteger(raw?.productId, 'productId', 1, MAX_CENTS);
    const quantity = parseInteger(raw?.quantity, 'quantity', 1, MAX_LINE_QUANTITY);
    quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
  }
  if (quantities.size > MAX_CART_LINES) {
    throw new HTTPException(400, {message: `At most ${MAX_CART_LINES} products per order.`});
  }
  for (const quantity of quantities.values()) {
    if (quantity > MAX_LINE_QUANTITY) {
      throw new HTTPException(400, {message: `At most ${MAX_LINE_QUANTITY} of each product.`});
    }
  }

  return {
    items: [...quantities].map(([productId, quantity]) => ({productId, quantity})),
    customer: {
      customerName: parseText(customer.customerName, 'customerName', 120),
      phone: parseText(customer.phone, 'phone', 40),
      addressLine1: parseText(customer.addressLine1, 'addressLine1', 200),
      addressLine2: parseOptionalText(customer.addressLine2, 'addressLine2', 200),
      city: parseText(customer.city, 'city', 100),
      postalCode: parseText(customer.postalCode, 'postalCode', 20),
      country: parseText(customer.country, 'country', 80),
      note: parseOptionalText(customer.note, 'note', 500),
    },
  };
});

export const orders = new Hono<DbEnv>()
  .use(withDb)
  /**
   * Place an order. Prices come from the database, never the client, and stock
   * is taken in the same transaction: if any line is short, nothing is saved.
   */
  .post('/checkout', checkoutBody, async c => {
    const {items: lines, customer} = c.req.valid('json');

    const row = await c.var.db.$transaction(async tx => {
      const products = await tx.product.findMany({
        where: {id: {in: lines.map(line => line.productId)}, active: true},
      });
      const byId = new Map(products.map(product => [product.id, product]));

      const items = lines.map(({productId, quantity}) => {
        const product = byId.get(productId);
        if (!product) {
          throw new HTTPException(409, {
            message: 'A product in your cart is no longer available.',
          });
        }
        return {
          productId,
          name: product.name,
          unitPriceCents: product.priceCents,
          quantity,
          lineTotalCents: product.priceCents * quantity,
        };
      });

      const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
      if (totalCents > MAX_CENTS) {
        throw new HTTPException(400, {message: 'The order total is too large.'});
      }

      for (const item of items) {
        // Conditional decrement: never below zero, even with orders racing.
        const {count} = await tx.product.updateMany({
          where: {id: item.productId, active: true, stock: {gte: item.quantity}},
          data: {stock: {decrement: item.quantity}},
        });
        if (count === 0) {
          const left = byId.get(item.productId)?.stock ?? 0;
          throw new HTTPException(409, {
            message:
              left > 0
                ? `Only ${left} of “${item.name}” left in stock.`
                : `“${item.name}” is out of stock.`,
          });
        }
      }

      return tx.order.create({
        data: {...customer, totalCents, currency: STORE_CURRENCY, items: {create: items}},
        include: {items: {orderBy: {id: 'asc'}}},
      });
    });

    return c.json({order: toOrder(row)}, 201);
  })
  .get('/:publicId', async c => {
    const publicId = c.req.param('publicId');
    const row = UUID.test(publicId)
      ? await c.var.db.order.findUnique({
          where: {publicId},
          include: {items: {orderBy: {id: 'asc'}}},
        })
      : null;
    if (!row) {
      throw new HTTPException(404, {message: 'Order not found.'});
    }
    return c.json({order: toOrder(row)});
  });
