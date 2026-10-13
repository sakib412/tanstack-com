import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import {useState} from 'react';

import {BrandMark} from '../components/brand';
import {CartIcon, CloseIcon, MenuIcon} from '../components/icons';
import {NotFound} from '../components/not-found';
import {getSite, type Site} from '../lib/api';
import {useCartCount} from '../lib/cart-store';
import landingCss from '../landing.css?url';
import storeCss from '../store.css?url';
import appCss from '../styles.css?url';

export const Route = createRootRoute({
  /**
   * The brand is fetched ONCE here and reused by every page (header, footer,
   * `<title>`, favicon, the home hero). `getSite` is a server function, so this
   * runs on the Worker on first paint and as an RPC on client navigation — the
   * browser never talks to the API itself.
   */
  loader: async () => ({site: await getSite()}),
  head: ({loaderData}) => {
    const site = (loaderData as {site: Site | null} | undefined)?.site ?? null;
    return {
      meta: [
        {charSet: 'utf-8'},
        {name: 'viewport', content: 'width=device-width, initial-scale=1'},
        {title: site?.name ?? 'Community'},
      ],
      links: [
        {rel: 'stylesheet', href: appCss},
        // The storefront's own design system, scoped to `.store`.
        {rel: 'stylesheet', href: storeCss},
        {rel: 'stylesheet', href: landingCss},
        {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
        {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous'},
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        },
        ...(site?.favIcon ? [{rel: 'icon', href: site.favIcon}] : []),
      ],
    };
  },
  component: RootComponent,
  notFoundComponent: NotFoundRoute,
});

/** The brand, for any component under the root route. */
export function useSite(): Site | null {
  return Route.useLoaderData().site;
}

function NotFoundRoute() {
  return <NotFound site={useSite()} />;
}

/** Site navigation, shared by the desktop bar and the mobile menu. */
function NavLinks({onNavigate}: {onNavigate?: () => void}) {
  return (
    <>
      <Link to="/" activeOptions={{exact: true}} onClick={onNavigate}>
        Home
      </Link>
      <Link to="/shop" onClick={onNavigate}>
        Shop
      </Link>
      <Link to="/blog" onClick={onNavigate}>
        Blog
      </Link>
      {/*
        Plain <a>, NOT <Link>: `/feeds` is served by the platform App on
        this same hostname, not by this template. Routing it through the
        client router would 404 inside this app instead of leaving it.
      */}
      <a href="/feeds">Community</a>
    </>
  );
}

function SiteHeader({site, name}: {site: Site | null; name: string}) {
  const [open, setOpen] = useState(false);
  // The cart lives in the browser, so the badge appears after hydration.
  const cartCount = useCartCount();
  const close = () => setOpen(false);

  return (
    <header className="site-header" data-open={open || undefined}>
      <div className="wrap site-header-inner">
        <Link to="/" className="brand" onClick={close}>
          <BrandMark site={site} />
          <span className="brand-name">{name}</span>
        </Link>

        <nav className="site-nav" aria-label="Main">
          <NavLinks />
        </nav>

        <div className="header-actions">
          <Link
            to="/cart"
            className="cart-link"
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
            onClick={close}
          >
            <CartIcon size={20} />
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </Link>
          {/* App pages: plain <a>. */}
          <a href="/login" className="header-login">
            Log in
          </a>
          <a href="/join" className="header-join">
            Join
          </a>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(value => !value)}
          >
            {open ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile" hidden={!open}>
        <div className="wrap">
          <NavLinks onNavigate={close} />
          <a href="/login">Log in</a>
          <a href="/join" className="mobile-join">
            Join
          </a>
        </div>
      </nav>
    </header>
  );
}

function SiteFooter({site, name}: {site: Site | null; name: string}) {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Link to="/" className="brand">
            <BrandMark site={site} />
            <span className="brand-name">{name}</span>
          </Link>
        </div>
        <nav className="footer-col" aria-label="Explore">
          <h2>Explore</h2>
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/blog">Blog</Link>
        </nav>
        <nav className="footer-col" aria-label="Community">
          <h2>Community</h2>
          <a href="/feeds">Members’ area</a>
          <a href="/join">Join</a>
          <a href="/login">Log in</a>
        </nav>
        <nav className="footer-col" aria-label="Orders">
          <h2>Orders</h2>
          <Link to="/cart">Cart</Link>
          <Link to="/checkout">Checkout</Link>
        </nav>
      </div>
      <div className="wrap footer-bottom">
        <span>
          © {new Date().getUTCFullYear()} {name}
        </span>
        {/*
          TODO(ticket: reseller branding): white-label communities on a
          reseller agency show the RESELLER's name here, and communities on
          a paid plan show no attribution at all. The attribution rule lives
          on the platform, so this line must come from an API field rather
          than being decided here. Placeholder until that ticket lands.
        */}
        <span>Powered by EzyCommunity</span>
      </div>
    </footer>
  );
}

function RootComponent() {
  const site = useSite();
  const name = site?.name ?? 'Community';

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <SiteHeader site={site} name={name} />
        <Outlet />
        <SiteFooter site={site} name={name} />
        <Scripts />
      </body>
    </html>
  );
}
