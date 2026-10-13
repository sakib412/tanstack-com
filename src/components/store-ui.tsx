/** Small layout pieces shared by the storefront pages. */
import {Link} from '@tanstack/react-router';
import type {ReactNode} from 'react';

import {AlertIcon, ChevronRightIcon} from './icons';

export interface Crumb {
  label: string;
  to?: '/' | '/shop' | '/cart';
}

export function Breadcrumbs({items}: {items: Array<Crumb>}) {
  return (
    <nav className="s-breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={item.label}>
            {index > 0 && <ChevronRightIcon size={14} />}
            {item.to ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({
  crumbs,
  title,
  subtitle,
  aside,
}: {
  crumbs?: Array<Crumb>;
  title: string;
  subtitle?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="s-page-header">
      <div className="s-wrap">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <div className="s-page-header-row">
          <div>
            <h1 className="s-title">{title}</h1>
            {subtitle && <p className="s-subtitle">{subtitle}</p>}
          </div>
          {aside}
        </div>
      </div>
    </header>
  );
}

export function Alert({
  children,
  tone = 'danger',
}: {
  children: ReactNode;
  tone?: 'danger' | 'info' | 'success';
}) {
  return (
    <div className={`s-alert s-alert-${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <AlertIcon size={18} />
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="s-empty">
      <div className="s-empty-icon">{icon}</div>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

/** Placeholder while the browser cart is read and priced. */
export function CartSkeleton() {
  return (
    <div className="s-checkout-grid" aria-busy="true" aria-label="Loading your cart">
      <div className="s-card s-skeleton-card">
        {[0, 1].map(index => (
          <div key={index} className="s-skeleton-row">
            <span className="s-skeleton s-skeleton-thumb" />
            <span className="s-skeleton-lines">
              <span className="s-skeleton s-skeleton-line" />
              <span className="s-skeleton s-skeleton-line short" />
            </span>
          </div>
        ))}
      </div>
      <div className="s-card s-skeleton-card">
        <span className="s-skeleton s-skeleton-line" />
        <span className="s-skeleton s-skeleton-line short" />
        <span className="s-skeleton s-skeleton-button" />
      </div>
    </div>
  );
}
