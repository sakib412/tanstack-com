import {createMiddleware} from 'hono/factory';
import {HTTPException} from 'hono/http-exception';

import type {PrismaClient} from '../generated/prisma/client';
import {createDb, hasDatabase} from './db';

export type DbEnv = {Variables: {db: PrismaClient}};

/** A database client for the request, or 503 while the Site Database is off. */
export const withDb = createMiddleware<DbEnv>(async (c, next) => {
  if (!hasDatabase()) {
    throw new HTTPException(503, {message: 'The Site Database is not enabled.'});
  }
  c.set('db', createDb());
  await next();
});
