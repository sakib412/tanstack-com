import type {Site} from './api';

/**
 * The community's brand inside a CHILD route's `head({matches})`.
 *
 * The brand is loaded once by the root route; `head` only receives its OWN
 * route's `loaderData`, so a child that wants the community name reads the root
 * match instead of calling `getSite()` again — a second call here would be one
 * extra API round trip per page render for a string we already have.
 */
export function siteFromMatches(
  matches: Array<{routeId: string; loaderData?: unknown}>
): Site | null {
  const root = matches.find(match => match.routeId === '__root__');
  return (root?.loaderData as {site?: Site | null} | undefined)?.site ?? null;
}

/** "Blog · Acme" — falls back to the bare page name before the brand loads. */
export function pageTitle(
  matches: Array<{routeId: string; loaderData?: unknown}>,
  page: string
): string {
  const name = siteFromMatches(matches)?.name;
  return name ? `${page} · ${name}` : page;
}
