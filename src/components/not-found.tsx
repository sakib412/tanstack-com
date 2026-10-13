import {Link} from '@tanstack/react-router';

import type {Site} from '../lib/api';
import {BrandMark} from './brand';

/**
 * The branded 404.
 *
 * Unknown paths are the TEMPLATE's to answer, not the platform's: the
 * dispatcher sends `/`, `/<slug…>`, `/blog` and `/blog/<slug>` here and
 * everything else (login, feeds, dashboard, api…) to the App, so a path that
 * reaches this Worker and matches no page genuinely does not exist.
 */
export function NotFound({site}: {site: Site | null}) {
  return (
    <main className="wrap narrow section center">
      <BrandMark site={site} size={56} />
      <p className="eyebrow">404</p>
      <h1>This page does not exist</h1>
      <p className="lede">
        The page you were looking for isn’t part of {site?.name ?? 'this site'}.
      </p>
      <p>
        <Link className="button" to="/">
          Back to home
        </Link>
      </p>
    </main>
  );
}
