import {Link} from '@tanstack/react-router';

import type {PostSummary} from '../lib/api';
import {formatDate, preview} from '../lib/format';

/** Cover image, or a flat brand-tinted block so rows line up without one. */
export function PostCover({post, className}: {post: PostSummary; className?: string}) {
  return post.coverUrl ? (
    <img
      className={className ? `cover ${className}` : 'cover'}
      src={post.coverUrl}
      alt=""
      loading="lazy"
    />
  ) : (
    <span className={className ? `cover cover-empty ${className}` : 'cover cover-empty'} />
  );
}

/** The default card: cover, title, excerpt, date. Used by the grids. */
export function PostCard({post}: {post: PostSummary}) {
  return (
    <Link className="post-card" to="/blog/$slug" params={{slug: post.slug}}>
      <PostCover post={post} />
      <div className="post-card-body">
        <h3>{post.title}</h3>
        <p className="muted small">{preview(post.excerpt, undefined, 110)}</p>
        <p className="meta">{formatDate(post.publishedAt)}</p>
      </div>
    </Link>
  );
}
