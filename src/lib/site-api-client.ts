/**
 * The Site API (`src/server/site-api.ts`), called IN-PROCESS from server
 * functions via `app.request`: no network hop, and no fetch of our own
 * hostname (deployed, that would reach the platform App, not this Worker).
 *
 * Only call these from inside a `createServerFn` handler. The Site API module
 * is imported lazily so the database client and `cloudflare:workers` stay out
 * of the browser bundle.
 */
import {hc} from 'hono/client';

import type {AppType} from '../server/site-api';

export async function siteApi() {
  const {app} = await import('../server/site-api');
  // The origin is a placeholder: `app.request` never leaves this Worker.
  const client = hc<AppType>('http://site.internal', {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => app.request(input, init),
  });
  return client['site-api'];
}

/** The Site API's JSON `{error}` message, or a generic one. */
export async function errorOf(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as {error?: string} | null;
  return body?.error ?? `Request failed (${res.status}).`;
}
