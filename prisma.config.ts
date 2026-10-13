import {defineConfig} from 'prisma/config';

// `DATABASE_URL` is the Site Database (here: its Preview Database), set by the
// platform. Read with a fallback rather than prisma's `env()`, which throws:
// `prisma generate` runs in the Build, where there is no database.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Sample products for the Preview Database only (never run on publish).
    seed: 'prisma db execute --file prisma/seed.sql',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
