/**
 * The Site Database (Prisma Postgres), SERVER only.
 *
 * A new client per request, on the HTTP adapter: a Worker cannot keep a pool
 * between requests, and raw TCP drivers (`pg`) do not work there at all.
 * `DATABASE_URL` is a platform-provided Worker secret — read from `env`, never
 * logged, never sent to the browser.
 */
import {PrismaPostgresAdapter} from '@prisma/adapter-ppg';
import {env} from 'cloudflare:workers';

import {PrismaClient} from '../generated/prisma/client';

/** Empty until the owner enables the Site Database for this community. */
export function hasDatabase(): boolean {
  return Boolean(env.DATABASE_URL);
}

export function createDb(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPostgresAdapter({connectionString: env.DATABASE_URL ?? ''}),
  });
}
