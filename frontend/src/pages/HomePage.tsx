import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { PostCard } from '@/components/PostCard';
import { PostCardSkeleton } from '@/components/PostCardSkeleton';
import { postService } from '@/services/postService';
import { getDateFromId, resolveImageUrl } from '@/lib/utils';
import type { Post } from '@/types';

const LIMIT = 10;

export function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMorePosts = useCallback(async (currentPage: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      const newPosts = await postService.getPosts(currentPage, LIMIT);
      if (newPosts.length < LIMIT) setHasMore(false);
      setPosts(prev => [...prev, ...newPosts]);
      setPage(currentPage + 1);
    } catch {
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadMorePosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sentinel = observerRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          setPage(prev => {
            loadMorePosts(prev);
            return prev;
          });
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMorePosts]);

  const featuredPosts = posts.slice(0, 3);
  const gridPosts = posts.slice(3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-10">
        {featuredPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Featured</h2>
            <div className="space-y-4">
              {featuredPosts.map(post => (
                <FeaturedPostCard
                  key={post._id}
                  post={post}
                  authorEmail={typeof post.authorId === 'object' ? post.authorId.email : '…'}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          {posts.length > 3 && (
            <h2 className="text-2xl font-bold mb-6">Latest</h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridPosts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                authorEmail={typeof post.authorId === 'object' ? post.authorId.email : '…'}
              />
            ))}
            {isLoading && (
              <>
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </>
            )}
          </div>

          {!hasMore && posts.length > 0 && (
            <p className="text-center text-muted-foreground text-sm mt-10">
              You've reached the end.
            </p>
          )}
        </section>

        <div ref={observerRef} className="h-4 mt-4" />
      </main>
    </div>
  );
}

function FeaturedPostCard({ post, authorEmail }: { post: Post; authorEmail: string }) {
  const excerpt = post.text.length > 200 ? post.text.slice(0, 200) + '…' : post.text;
  const date = getDateFromId(post._id).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      to={`/posts/${post._id}`}
      className="flex gap-6 rounded-xl border bg-card p-4 hover:shadow-md transition-shadow group"
    >
      {post.image && (
        <img
          src={resolveImageUrl(post.image)}
          alt={post.title}
          className="w-40 h-28 object-cover rounded-lg shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-1">{authorEmail} · {date}</p>
        <h3 className="text-lg font-bold leading-snug mb-2 group-hover:underline line-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{excerpt}</p>
        <div className="flex gap-4 mt-3 text-muted-foreground text-xs">
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />{post.likesCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />{post.commentsCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
