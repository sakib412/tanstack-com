import {createFileRoute, Link, notFound} from '@tanstack/react-router';

import {getPost} from '../lib/api';
import {formatDate, initials, preview, readingMinutes} from '../lib/format';
import {pageTitle} from '../lib/title';

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({params}) => {
    const post = await getPost({data: {slug: params.slug}});
    if (!post) {
      // Unknown or unpublished slug under `/blog` is ours to 404 — the
      // dispatcher never sends it to the App.
      throw notFound();
    }
    return post;
  },
  head: ({loaderData, matches}) => ({
    meta: loaderData
      ? [
          {title: pageTitle(matches, loaderData.title)},
          {name: 'description', content: preview(loaderData.excerpt, loaderData.content)},
          {property: 'og:title', content: loaderData.title},
          ...(loaderData.coverUrl
            ? [{property: 'og:image', content: loaderData.coverUrl}]
            : []),
        ]
      : [],
  }),
  component: BlogPost,
});

function BlogPost() {
  const post = Route.useLoaderData();

  return (
    <main>
      <header
        className="post-hero"
        style={
          post.coverUrl
            ? {
                // `backgroundImage`, not the `background` shorthand: the
                // shorthand resets background-color and a cover that fails to
                // load would leave the hero transparent. Quoted so a url
                // containing `(` or `)` cannot end the css function early, and
                // NOT re-encoded — the CDN mints it already percent-encoded.
                backgroundImage: `url("${post.coverUrl.replace(/"/g, '%22')}")`,
              }
            : undefined
        }>
        <div className="wrap center post-hero-inner">
          <h1>{post.title}</h1>
          <p className="post-meta">
            {post.authors.map(author => (
              <span className="author" key={author.id}>
                {author.avatar ? (
                  <img src={author.avatar} alt="" width={24} height={24} />
                ) : (
                  <span className="avatar-fallback" aria-hidden="true">
                    {initials(author.name)}
                  </span>
                )}
                {/* Name only. A member's email is never sent to the browser. */}
                {author.name}
              </span>
            ))}
            {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
            <span>{readingMinutes(post.content)} minute read</span>
          </p>
        </div>
      </header>

      <article className="wrap narrow section">
        {/*
          Same rendering as the community's own blog page
          (apps/community .../(public)/blog/[slug]/page.tsx → `DisplayContent`):
          the body is inserted as HTML with no sanitiser. It is rich text
          written by the community's own blog admins in the platform editor and
          stored as HTML — the platform trusts it at the same level on its own
          blog route. Deliberately no sanitiser here: adding one would strip
          embeds the editor legitimately produces AND would still be a different
          output from the App's, which is worse than matching it.
        */}
        <div className="prose" dangerouslySetInnerHTML={{__html: post.content}} />

        {(post.categories.length > 0 || post.tags.length > 0) && (
          <p className="terms">
            {post.categories.map(category => (
              <span className="chip" key={`c${category.id}`}>
                {category.name}
              </span>
            ))}
            {post.tags.map(tag => (
              <span className="chip chip-tag" key={`t${tag.id}`}>
                #{tag.name}
              </span>
            ))}
          </p>
        )}

        <p className="section">
          <Link to="/blog">← All posts</Link>
        </p>
      </article>
    </main>
  );
}
