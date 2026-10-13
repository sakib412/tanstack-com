import {createFileRoute, Link} from '@tanstack/react-router';

import {PostCard} from '../components/post-card';
import {listPosts} from '../lib/api';
import {pageTitle} from '../lib/title';
import {useSite} from './__root';

const PER_PAGE = 9;

export const Route = createFileRoute('/blog/')({
  // `page?:` — optional, so `<Link to="/blog">` does not have to pass one, and
  // absent stays absent: defaulting a key the URL lacks makes the router 307 to
  // the canonical url, i.e. `/blog` would redirect to `/blog?page=1`.
  validateSearch: (search: Record<string, unknown>): {page?: number} =>
    search.page === undefined ? {} : {page: Math.max(1, Number(search.page) || 1)},
  loaderDeps: ({search}) => ({page: search.page ?? 1}),
  loader: async ({deps}) => await listPosts({data: {page: deps.page, limit: PER_PAGE}}),
  head: ({matches}) => ({meta: [{title: pageTitle(matches, 'Blog')}]}),
  component: BlogIndex,
});

function BlogIndex() {
  const {posts, meta} = Route.useLoaderData();
  const site = useSite();

  return (
    <main className="wrap section">
      <p className="eyebrow">{site?.name ?? 'Community'}</p>
      <h1>Blog</h1>

      {posts.length === 0 ? (
        <p className="lede">No posts published yet.</p>
      ) : (
        <div className="grid grid-3">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {meta.lastPage > 1 && (
        <nav className="pager">
          {meta.currentPage > 1 && (
            <Link to="/blog" search={{page: meta.currentPage - 1}}>
              ← Newer
            </Link>
          )}
          <span className="muted small">
            Page {meta.currentPage} of {meta.lastPage}
          </span>
          {meta.currentPage < meta.lastPage && (
            <Link to="/blog" search={{page: meta.currentPage + 1}}>
              Older →
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
