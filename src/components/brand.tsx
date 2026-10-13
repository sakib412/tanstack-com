import type {Site} from '../lib/api';
import {initials} from '../lib/format';

/**
 * The community's mark: logo when it has one, monogram fallback otherwise.
 * `initial-data` carries no description and no brand colour, so name + logo is
 * the whole brand the template gets.
 */
export function BrandMark({site, size = 32}: {site: Site | null; size?: number}) {
  const name = site?.name ?? 'Community';
  if (site?.logo) {
    return (
      <img
        className="brand-logo"
        src={site.logo}
        alt={name}
        width={size}
        height={size}
        style={{height: size}}
      />
    );
  }
  return (
    <span
      className="brand-monogram"
      style={{width: size, height: size, fontSize: size * 0.4}}
      aria-hidden="true">
      {initials(name)}
    </span>
  );
}
