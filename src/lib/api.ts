/**
 * The community's public API, read from the SERVER only.
 *
 * WHY server-only, always:
 * Every outbound `fetch` a deployed Site Worker makes is routed through the
 * platform's Outbound Worker, which allows ONE hostname — the community's own.
 * A fetch issued from the visitor's browser does not go through it at all, so
 * it is neither allowlisted nor stamped with the community's identity, and it
 * would break the moment the Site is served on a custom hostname. So every
 * call below is wrapped in a TanStack Start server function: the browser calls
 * OUR server (an RPC to this same Worker), and only the Worker calls the API.
 * Never move these `fetch`es into a component or a plain loader.
 *
 * WHERE the hostname comes from:
 * `EZY_SITE_URL` is the community's own site origin (e.g.
 * `https://intel.ezycommunity.com`). The platform injects it as a Worker var at
 * deploy time; locally it comes from `.env` / the shell (see `.env.example`).
 * When it is missing we fall back to the origin of the incoming request, which
 * is the same hostname in production anyway.
 *
 * WHY the browser-ish headers:
 * The community hostname sits behind Cloudflare, which answers 403 to a request
 * with no `User-Agent`. Server-side fetches therefore always send one plus
 * `Accept: application/json`.
 *
 * WHY every payload is re-projected below:
 * The functions here return hand-built objects, never the raw JSON. The API
 * response is the platform's to change; anything it adds later (a member email
 * on an author row, say) must NOT start silently shipping to the browser. Email
 * addresses are private and never leave the server — that is why `toAuthor`
 * picks four fields by name instead of spreading.
 */
import {createServerFn} from '@tanstack/react-start';
import {getRequestUrl} from '@tanstack/react-start/server';

export interface Site {
  id: number;
  name: string;
  subdomain: string | null;
  domain: string | null;
  favIcon: string | null;
  logo: string | null;
  privacy: string | null;
  visibility: string | null;
}

export interface PostAuthor {
  id: number;
  /** Already joined server-side. Never an email — see the file header. */
  name: string;
  avatar: string | null;
}

export interface PostTerm {
  id: number;
  name: string;
  slug: string;
}

export interface PostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverUrl: string | null;
  publishedAt: string | null;
  authors: Array<PostAuthor>;
  categories: Array<PostTerm>;
  tags: Array<PostTerm>;
}

export interface Post extends PostSummary {
  /** Rich-text HTML authored in the community's blog editor. */
  content: string;
}

export interface PostsPage {
  posts: Array<PostSummary>;
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
}

/** The site's own origin, with any trailing slash removed. */
function siteOrigin(): string {
  const configured =
    typeof process === 'undefined' ? undefined : process.env.EZY_SITE_URL;
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  // No env: we are being served ON the community's hostname already, so the
  // incoming request's own origin is the right base.
  return getRequestUrl().origin;
}

async function apiGet<T>(pathname: string): Promise<T | null> {
  const res = await fetch(`${siteOrigin()}${pathname}`, {
    headers: {
      accept: 'application/json',
      // Cloudflare 403s a request with no User-Agent. See the file header.
      'user-agent':
        'Mozilla/5.0 (compatible; EzyCommunitySite/1.0; +https://ezycommunity.com)',
    },
  });
  if (!res.ok) {
    return null;
  }
  const body = (await res.json()) as {data?: T};
  return body?.data ?? null;
}

interface RawAuthor {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatar?: string | null;
}

function toAuthor(raw: RawAuthor): PostAuthor {
  const name =
    raw.displayName?.trim() ||
    [raw.firstName, raw.lastName].filter(Boolean).join(' ').trim() ||
    'Unknown author';
  return {id: raw.id, name, avatar: raw.avatar ?? null};
}

function toTerm(raw: PostTerm): PostTerm {
  return {id: raw.id, name: raw.name, slug: raw.slug};
}

function toSummary(raw: Record<string, unknown>): PostSummary {
  const list = <T>(value: unknown): Array<T> => (Array.isArray(value) ? value : []);
  return {
    id: raw.id as number,
    title: (raw.title as string) ?? '',
    slug: (raw.slug as string) ?? '',
    excerpt: (raw.excerpt as string | null) ?? null,
    coverUrl: (raw.coverUrl as string | null) ?? null,
    publishedAt: (raw.publishedAt as string | null) ?? null,
    authors: list<RawAuthor>(raw.authors).map(toAuthor),
    categories: list<PostTerm>(raw.categories).map(toTerm),
    tags: list<PostTerm>(raw.tags).map(toTerm),
  };
}

/**
 * `GET /api/public/site/v1/initial-data`
 *
 * The community's brand: name, logo, favicon. Measured against a live
 * community — there is no description and no colour in this payload, so the
 * template's brand is exactly "name + logo + favicon".
 */
export const getSite = createServerFn({method: 'GET'}).handler(
  async (): Promise<Site | null> => {
    const raw = await apiGet<Record<string, unknown>>(
      '/api/public/site/v1/initial-data'
    );
    if (!raw) {
      return null;
    }
    return {
      id: raw.id as number,
      name: (raw.name as string) ?? 'Community',
      subdomain: (raw.subdomain as string | null) ?? null,
      domain: (raw.domain as string | null) ?? null,
      favIcon: (raw.favIcon as string | null) ?? null,
      logo: (raw.logo as string | null) ?? null,
      privacy: (raw.privacy as string | null) ?? null,
      visibility: (raw.visibility as string | null) ?? null,
    };
  }
);

/**
 * `GET /api/public/blog/post/all-posts?page=&per_page=`
 *
 * Published posts, newest live first. The page size parameter is `per_page`
 * (measured: `limit` is ignored and you silently get 10). The envelope is
 * `{data: {meta, data: [...]}}` — Lucid's paginator, so `meta.lastPage` is the
 * page count.
 */
export const listPosts = createServerFn({method: 'GET'})
  .validator((input: {page?: number; limit?: number} | undefined) => input ?? {})
  .handler(async ({data}): Promise<PostsPage> => {
    const page = Math.max(1, data.page ?? 1);
    const perPage = Math.min(50, Math.max(1, data.limit ?? 10));
    const raw = await apiGet<{
      meta?: Record<string, number>;
      data?: Array<Record<string, unknown>>;
    }>(`/api/public/blog/post/all-posts?page=${page}&per_page=${perPage}`);

    return {
      posts: (raw?.data ?? []).map(toSummary),
      meta: {
        total: raw?.meta?.total ?? 0,
        perPage: raw?.meta?.perPage ?? perPage,
        currentPage: raw?.meta?.currentPage ?? page,
        lastPage: raw?.meta?.lastPage ?? 1,
      },
    };
  });

/**
 * `GET /api/public/blog/post/<slug>/read`
 *
 * One published post with its `content` HTML. 404s for an unknown or
 * unpublished slug, which we surface as `null` so the route can render the
 * branded 404 instead of an error page.
 */
export const getPost = createServerFn({method: 'GET'})
  .validator((input: {slug: string}) => ({slug: String(input.slug)}))
  .handler(async ({data}): Promise<Post | null> => {
    const raw = await apiGet<Record<string, unknown>>(
      `/api/public/blog/post/${encodeURIComponent(data.slug)}/read`
    );
    if (!raw) {
      return null;
    }
    return {...toSummary(raw), content: (raw.content as string) ?? ''};
  });
