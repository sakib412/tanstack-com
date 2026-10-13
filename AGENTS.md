# Rules for AI agents working in this app

This repo renders ONE community's public Site: `/`, `/<slug…>`, `/blog`,
`/blog/<slug>` and a 404 for anything else. Every other path on the hostname
(`/login`, `/join`, `/feeds`, `/dashboard`, `/api`, `/_next`…) is served by the
EzyCommunity platform and never reaches this code — link to those with a plain
`<a href>`, NEVER a router `<Link>`.

- The platform recognises this project by `@tanstack/react-start` in
  `package.json`. Never add `astro`, `next` or another framework next to it —
  the project is then refused.
- This Template uses npm: keep `package-lock.json` committed (the Build then
  runs `npm ci`) and add no second lockfile. That is the Template's choice —
  the platform picks npm, pnpm or yarn from the lockfile, and refuses bun.
- Never add a route under an App path (`src/routes/api.*`, `login.tsx`,
  `feeds/`…) or a `robots.txt` / `sitemap.xml` (as a route or in `public/`) —
  the App owns those URLs and visitors never reach them.
- Routes are file-based under `src/routes/`. `routeTree.gen.ts` is GENERATED —
  never edit or import it except from `src/router.tsx`.
- A new route file is NOT scaffolded (`customScaffolding` in `vite.config.ts`):
  write the whole route yourself. Never leave a route file empty mid-write; if a
  route shows `Hello "/"!`, restore it from git.
- This Template does ALL data access in `src/lib/api.ts`, and every function
  there is a `createServerFn` server function: pages arrive with their data,
  and `api.ts` decides field by field what reaches the browser. Keep it that
  way — never call the API from a component, an effect, or a plain
  (non-server-fn) loader. (The platform itself also allows browser fetches to
  relative `/api/public/...`; server-only is this Template's choice.)
- The API base is `process.env.EZY_SITE_URL` (the community's own origin, set by
  the platform), falling back to the incoming request's origin. Relative fetch
  URLs throw on the server.
- The community hostname is behind Cloudflare, which 403s a request with no
  `User-Agent`: server-side fetches must send one plus `Accept: application/json`.
- NEVER let a member email reach the browser — not rendered, not in the payload.
  `src/lib/api.ts` re-projects every API response field by field for exactly
  this reason; keep that shape rather than spreading raw JSON.
- Brand = name + logo + favicon from `/api/public/site/v1/initial-data`. That
  payload has no description and no colours; don't invent fields for them.
- Keep `vite.config.ts`'s guard around `@cloudflare/vite-plugin` and its `server`
  block intact: the plugin is only active when the PLATFORM has written a
  wrangler config, and the Preview's proxy needs `host: '0.0.0.0'` +
  `allowedHosts: true`.
- Do not add a base path or asset prefix: the app is served at `/` on its own
  origin.
- A child route's `head` only gets its OWN `loaderData`; read the community name
  from the root match via `pageTitle(matches, …)` in `src/lib/title.ts` rather
  than calling `getSite()` again for a string that is already loaded.
- No `.github/workflows/` — the site deploys from the platform (a push to the
  connected branch, or a zip upload), not from Actions.

## Platform rules

True for any code on an EzyCommunity Site, not only this Template:

- **What is built is detected from the files, and the verdict is final:**
  TanStack Start (`@tanstack/react-start`), Astro (static, or SSR with
  `@astrojs/cloudflare` only), or a root `index.html` published as-is.
  Next.js, Nuxt, SvelteKit, Remix, React Router (framework mode), Gatsby,
  Angular and un-built Vite / CRA / Eleventy source are refused. The project
  sits at the repository root (a zip may wrap it in one folder); a Node project
  has one lockfile (npm, pnpm or yarn; bun is refused). Server code runs on
  Cloudflare Workers (`nodejs_compat`), not Node.
- **The App owns** `/api`, `/login`, `/join`, `/feeds`, `/dashboard`,
  `/settings`, `/_next`, `/robots.txt`, `/sitemap.xml`,
  `/<product>/<id>/checkout` and more: a file or route there is never served
  (the dashboard lists it as a shadowed path). Link to App pages with a plain
  `<a href>`.
- **Community data comes from its own hostname.** The public API
  (`/api/public/...`): server code builds the URL from `EZY_SITE_URL` (a plain
  variable, not a secret), browser code uses relative URLs. Server code may
  also read as the community, at member level, from `/api/site/v1/...` with
  `Authorization: Bearer ${env.EZY_COMMUNITY_KEY}` — never emails or payment
  data. Data fetched during the Build is frozen until the next Build (a
  Redeploy reuses the old output) — fetch at request time or in the browser.
- **Secrets are platform-provided only.** The platform sets `DATABASE_URL`
  (the Site Database) and `EZY_COMMUNITY_KEY` as Worker secrets: read them
  from `env` (`import {env} from 'cloudflare:workers'`) in server code only.
  Never send them to the browser, log them, write them to a file (`.env`,
  `.dev.vars`, config) or commit them. You cannot add secrets: never hardcode
  a key, token or password, never ask the owner for one. Never send a
  member's email address to the browser.
- **Network.** Deployed server code reaches ONLY the community's own hostname
  and its Site Database (`db.prisma.io`); every other host fails `403 Egress
  blocked`. Raw TCP (`pg`, `postgres`, `node:net`) does not work at all.
- **Site API and Site Database**: one Hono app at `/site-api/*`
  (`src/server/site-api.ts`, sub-apps in `src/server/routes/`), mounted by
  `src/routes/site-api/$.ts`, on Prisma 7 Postgres (`prisma/schema.prisma`,
  `src/server/db.ts`). Pages reach it only through server functions
  (`src/lib/shop.ts`, `src/lib/cart.ts`, `src/lib/todos.ts`), which call it
  in-process via `src/lib/site-api-client.ts`. `prisma/seed.sql` is sample
  data for the Preview Database only. The Astro app Template
  (`AppifyLab/ezy-template-community-astro-app`) shows both.
- **Storefront**: `/shop`, `/shop/<slug>`, `/cart`, `/checkout`,
  `/orders/<publicId>`. The cart lives in the BROWSER (`src/lib/cart-store.ts`,
  localStorage with an in-memory fallback) as product ids and quantities only
  — not a cookie, which embedded previews and strict browsers drop. Prices
  always come from the database (`priceCart`); checkout re-prices and takes
  stock in one transaction. Payment is on delivery — no payment provider is reachable.
  There is NO public order list: an order is reachable only by its
  unguessable `publicId`. Storefront styles live in `src/store.css`, scoped
  to `.store`; don't restyle the rest of the site from there.
- **Landing page** (`/`, styles in `src/landing.css`): built only from real
  data — brand, products, blog. A section with nothing to show is left out;
  never fill it with placeholder copy, invented stats or testimonials.
- **No deploy config.** Don't commit `wrangler.*`: the platform writes the
  Worker config and drops any KV, R2, D1 or other binding.
