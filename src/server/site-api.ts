/**
 * The Site API: this site's own backend, mounted at `/site-api/*` by
 * `src/routes/site-api/$.ts`.
 *
 * Pages never `fetch()` it over the network — deployed, a fetch of our own
 * hostname reaches the platform App, not this Worker. Server code calls it
 * in-process instead (`app.request`, see `src/lib/site-api-client.ts`).
 *
 * Routes are CHAINED (and sub-apps mounted with `.route`) so `AppType` carries
 * every route for the typed `hc` client.
 */
import {Hono} from 'hono';
import {csrf} from 'hono/csrf';
import {HTTPException} from 'hono/http-exception';

import {orders} from './routes/orders';
import {products} from './routes/products';
import {todos} from './routes/todos';

export type {Order, OrderLine, OrderStatus} from './routes/orders';
export type {Product} from './routes/products';
export type {Todo} from './routes/todos';

export const app = new Hono()
  .basePath('/site-api')
  .use(csrf())
  .route('/todos', todos)
  .route('/products', products)
  .route('/orders', orders)
  .notFound(c => c.json({error: 'Not found.'}, 404))
  .onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({error: err.message || `Request refused (${err.status}).`}, err.status);
    }
    // Never echo internals (they may carry connection details).
    console.error('site-api error:', err instanceof Error ? err.name : 'unknown');
    return c.json({error: 'Something went wrong.'}, 500);
  });

export type AppType = typeof app;
