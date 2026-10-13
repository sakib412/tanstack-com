import {createFileRoute, notFound} from '@tanstack/react-router';

/**
 * Catch-all for `/<slug…>`.
 *
 * Per the path-split contract this Worker owns `/`, `/<slug>` (nested too),
 * `/blog` and `/blog/<slug>`; every App path (login, feeds, dashboard, api,
 * _next…) is routed to the platform origin and never arrives here. So anything
 * that reaches this route is a Site page that does not exist, and the template
 * — not the App — must answer it. Custom page slugs are a later ticket; until
 * then every unknown slug is a branded 404.
 */
export const Route = createFileRoute('/$')({
  loader: () => {
    throw notFound();
  },
});
