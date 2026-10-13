import {createFileRoute, Link} from '@tanstack/react-router';
import type {CSSProperties, PointerEvent, ReactNode} from 'react';

import {BrandMark} from '../components/brand';
import {
  ArrowRightIcon,
  BagIcon,
  BookIcon,
  CartIcon,
  TruckIcon,
  UsersIcon,
  WalletIcon,
} from '../components/icons';
import {PostCover} from '../components/post-card';
import {ProductCard, ProductImage} from '../components/product';
import {listPosts, type PostSummary} from '../lib/api';
import {formatDate, preview} from '../lib/format';
import {listProducts, type Product} from '../lib/shop';
import {formatMoney} from '../lib/store';
import {useSite} from './__root';

/**
 * The landing page. Every section is built from REAL data — the community's
 * brand, its products and its blog — and a section with nothing to show is
 * left out rather than filled with placeholder copy.
 *
 * Motion is pure CSS (src/landing.css): entrance keyframes in the hero and
 * scroll-driven reveals (`.l-reveal`) elsewhere, so the server-rendered page is
 * fully visible without JavaScript. The only script is the cursor spotlight.
 */
export const Route = createFileRoute('/')({
  loader: async () => {
    const [blog, shop] = await Promise.all([
      listPosts({data: {limit: 3}}),
      listProducts({data: {limit: 100}}),
    ]);
    return {
      posts: blog.posts,
      postCount: blog.meta.total,
      products: shop.products,
    };
  },
  component: Home,
});

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** Stagger index for the CSS animations (`--i`). */
function stagger(index: number): CSSProperties {
  return {'--i': index} as CSSProperties;
}

/** Moves the card's spotlight (`--mx`/`--my`) under the cursor. */
function spotlight(event: PointerEvent<HTMLElement>) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
  el.style.setProperty('--my', `${event.clientY - rect.top}px`);
}

function Hero({name, products, hasPosts}: {name: string; products: Array<Product>; hasPosts: boolean}) {
  const site = useSite();
  const hasShop = products.length > 0;
  // Describe only what this site really offers.
  const offers = [
    hasShop && 'shop the official collection',
    hasPosts && 'read the latest posts',
    'join the conversation with fellow members',
  ].filter(Boolean) as Array<string>;
  const lede =
    offers.length === 1
      ? `${offers[0].charAt(0).toUpperCase()}${offers[0].slice(1)}.`
      : `${offers.slice(0, -1).join(', ').replace(/^./, c => c.toUpperCase())} and ${offers.at(-1)}.`;
  const showcase = products.filter(product => product.stock > 0).slice(0, 3);

  return (
    <section className="l-hero">
      <div className="l-hero-bg" aria-hidden="true">
        <span className="l-orb l-orb-1" />
        <span className="l-orb l-orb-2" />
        <span className="l-orb l-orb-3" />
      </div>
      <div className="s-wrap l-hero-inner">
        <div className="l-hero-copy">
          <span className="l-kicker l-in" style={stagger(0)}>
            <BrandMark site={site} size={22} />
            <span>{name}</span>
            <span className="l-kicker-dot" aria-hidden="true" />
          </span>
          <h1 className="l-hero-title">
            <span className="l-in l-hero-welcome" style={stagger(1)}>
              Welcome to
            </span>{' '}
            <span className="l-in l-hero-name" style={stagger(2)}>
              <span className="l-gradient-text">{name}</span>
            </span>
          </h1>
          <div className="l-ornament l-in" style={stagger(3)} aria-hidden="true">
            <span />
            <i>✦</i>
            <span />
          </div>
          <p className="l-hero-lede l-in" style={stagger(4)}>
            {lede}
          </p>
          <div className="l-hero-actions l-in" style={stagger(5)}>
            {hasShop ? (
              <Link to="/shop" className="s-btn s-btn-primary s-btn-lg l-shine">
                <BagIcon size={18} />
                <span>Shop the collection</span>
              </Link>
            ) : (
              <a href="/join" className="s-btn s-btn-primary s-btn-lg l-shine">
                <span>Join {name}</span>
                <ArrowRightIcon size={18} />
              </a>
            )}
            {/* App pages: plain <a>, never <Link> — see __root. */}
            {hasShop && (
              <a href="/join" className="s-btn s-btn-secondary s-btn-lg">
                Join the community
              </a>
            )}
            <a href="/login" className="s-btn s-btn-ghost s-btn-lg">
              Log in
            </a>
          </div>
        </div>

        <div className="l-hero-visual" aria-hidden={showcase.length === 0}>
          {showcase.length > 0 ? (
            <div className="l-showcase" data-count={showcase.length}>
              {showcase.map((product, index) => (
                <Link
                  key={product.id}
                  to="/shop/$slug"
                  params={{slug: product.slug}}
                  className={`l-showcase-card l-showcase-${index}`}
                >
                  <ProductImage product={product} />
                  <span className="l-showcase-meta">
                    <span>{product.name}</span>
                    <strong>{formatMoney(product.priceCents)}</strong>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="l-emblem">
              <span className="l-emblem-ring l-emblem-ring-1" />
              <span className="l-emblem-ring l-emblem-ring-2" />
              <span className="l-emblem-ring l-emblem-ring-3" />
              <BrandMark site={site} size={120} />
            </div>
          )}
        </div>
      </div>
      <span className="l-scroll-cue" aria-hidden="true">
        <span />
      </span>
    </section>
  );
}

/** A slow ticker of real product names and post titles. Decorative only. */
function Marquee({items}: {items: Array<string>}) {
  // Repeat short lists so one copy is always wider than the screen.
  const row = Array.from({length: Math.ceil(8 / items.length)}, () => items).flat();
  return (
    <div className="l-marquee" aria-hidden="true">
      <div className="l-marquee-track">
        {[0, 1].map(copy => (
          <ul key={copy}>
            {row.map((item, index) => (
              <li key={index}>
                <span>{item}</span>
                <i>✦</i>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

function Explore({productCount, postCount}: {productCount: number; postCount: number}) {
  const cards = [
    productCount > 0 && {
      key: 'shop',
      icon: <BagIcon size={22} />,
      title: 'Shop',
      text: `${productCount >= 100 ? '100+' : plural(productCount, 'product')} available, delivered to your door.`,
      link: (
        <Link to="/shop" className="l-explore-link">
          Browse the shop <ArrowRightIcon size={16} />
        </Link>
      ),
    },
    postCount > 0 && {
      key: 'blog',
      icon: <BookIcon size={22} />,
      title: 'Blog',
      text: `${plural(postCount, 'article')} published so far.`,
      link: (
        <Link to="/blog" className="l-explore-link">
          Read the blog <ArrowRightIcon size={16} />
        </Link>
      ),
    },
    {
      key: 'community',
      icon: <UsersIcon size={22} />,
      title: 'Community',
      text: 'Conversations, updates and people — in the members’ area.',
      link: (
        <a href="/feeds" className="l-explore-link">
          Open the community <ArrowRightIcon size={16} />
        </a>
      ),
    },
  ].filter(Boolean) as Array<{key: string; icon: ReactNode; title: string; text: string; link: ReactNode}>;

  return (
    <section className="l-section l-explore-section" aria-labelledby="explore-title">
      <div className="s-wrap">
        <h2 id="explore-title" className="s-visually-hidden">
          Explore
        </h2>
        <div className="l-explore" data-count={cards.length}>
          {cards.map((card, index) => (
            <article
              key={card.key}
              className="s-card l-explore-card l-spot l-reveal"
              style={stagger(index)}
              onPointerMove={spotlight}
            >
              <span className="l-explore-icon">{card.icon}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              {card.link}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action: ReactNode;
}) {
  return (
    <div className="s-section-head l-section-head l-reveal">
      <div>
        <p className="s-eyebrow l-eyebrow">{eyebrow}</p>
        <h2 className="l-section-title">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function FeaturedProducts({products}: {products: Array<Product>}) {
  return (
    <section className="l-section">
      <div className="s-wrap">
        <SectionHead
          eyebrow="Shop"
          title="Shop the collection"
          action={
            <Link to="/shop" className="s-btn s-btn-secondary s-btn-md">
              View all products <ArrowRightIcon size={16} />
            </Link>
          }
        />
        <div className="s-product-grid l-product-grid">
          {products.slice(0, 4).map((product, index) => (
            <div key={product.id} className="l-reveal" style={stagger(index)}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {icon: <BagIcon size={22} />, title: 'Pick your products', text: 'Browse the shop and add what you like to your cart.'},
    {icon: <CartIcon size={22} />, title: 'Check out in a minute', text: 'Tell us where to deliver. No account or card needed.'},
    {icon: <WalletIcon size={22} />, title: 'Pay on delivery', text: 'You pay when your order arrives. Nothing is charged online.'},
    {icon: <TruckIcon size={22} />, title: 'Track your order', text: 'Your confirmation link always shows the latest status.'},
  ];
  return (
    <section className="l-section l-band">
      <div className="s-wrap">
        <div className="l-center-head l-reveal">
          <p className="s-eyebrow l-eyebrow l-eyebrow-center">How ordering works</p>
          <h2 className="l-section-title">
            Simple from <em>cart</em> to <em>door</em>
          </h2>
        </div>
        <ol className="l-steps">
          {steps.map((step, index) => (
            <li key={step.title} className="l-spot l-reveal" style={stagger(index)} onPointerMove={spotlight}>
              <span className="l-step-numeral" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="l-step-icon">{step.icon}</span>
              <span className="l-step-num">Step {index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function LatestPosts({posts}: {posts: Array<PostSummary>}) {
  const [lead, ...rest] = posts;
  return (
    <section className="l-section">
      <div className="s-wrap">
        <SectionHead
          eyebrow="Blog"
          title="Latest from the blog"
          action={
            <Link to="/blog" className="s-btn s-btn-secondary s-btn-md">
              All posts <ArrowRightIcon size={16} />
            </Link>
          }
        />
        <div className="l-posts" data-count={posts.length}>
          <Link to="/blog/$slug" params={{slug: lead.slug}} className="s-card l-post l-post-lead l-reveal">
            <span className="l-post-media">
              <PostCover post={lead} className="l-post-cover" />
            </span>
            <div className="l-post-body">
              <time className="l-post-date">{formatDate(lead.publishedAt)}</time>
              <h3>{lead.title}</h3>
              <p>{preview(lead.excerpt, undefined, 200)}</p>
              <span className="l-post-more">
                Read article <ArrowRightIcon size={15} />
              </span>
            </div>
          </Link>
          {rest.map((post, index) => (
            <Link
              key={post.id}
              to="/blog/$slug"
              params={{slug: post.slug}}
              className="s-card l-post l-reveal"
              style={stagger(index + 1)}
            >
              <span className="l-post-media">
                <PostCover post={post} className="l-post-cover" />
              </span>
              <div className="l-post-body">
                <time className="l-post-date">{formatDate(post.publishedAt)}</time>
                <h3>{post.title}</h3>
                <p>{preview(post.excerpt, undefined, 110)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function JoinBand({name}: {name: string}) {
  return (
    <section className="l-section">
      <div className="s-wrap">
        <div className="l-cta l-reveal">
          <div className="l-cta-glow" aria-hidden="true" />
          <div className="l-cta-copy">
            <p className="l-cta-eyebrow">✦ Members’ area</p>
            <h2>
              Become part of <em>{name}</em>
            </h2>
            <p>Create your account to join the conversation in the members’ area.</p>
          </div>
          <div className="l-cta-actions">
            <a href="/join" className="s-btn s-btn-lg l-cta-primary l-shine">
              Join now <ArrowRightIcon size={18} />
            </a>
            <a href="/login" className="s-btn s-btn-lg l-cta-secondary">
              Log in
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const {posts, postCount, products} = Route.useLoaderData();
  const site = useSite();
  const name = site?.name ?? 'Community';
  const ticker = [...products.slice(0, 8).map(product => product.name), ...posts.map(post => post.title)];

  return (
    <main className="store landing">
      <Hero name={name} products={products} hasPosts={posts.length > 0} />
      {ticker.length > 0 && <Marquee items={ticker} />}
      <Explore productCount={products.length} postCount={postCount} />
      {products.length > 0 && <FeaturedProducts products={products} />}
      {products.length > 0 && <HowItWorks />}
      {posts.length > 0 && <LatestPosts posts={posts} />}
      <JoinBand name={name} />
    </main>
  );
}
