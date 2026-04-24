import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { RecommendedUserRow } from '@/components/RecommendedUserRow';
import { PostCard } from '@/components/PostCard';
import { PostCardSkeleton } from '@/components/PostCardSkeleton';
import { AuthorBadge } from '@/components/AuthorBadge';
import { postService } from '@/services/postService';
import { topicService } from '@/services/topicService';
import { userService } from '@/services/userService';
import type { Topic } from '@/services/topicService';
import type { RecommendedUser } from '@/types';
import { getDateFromId, resolveImageUrl, stripMarkdown } from '@/lib/utils';
import type { Post } from '@/types';

const LIMIT = 10;
const VISIBLE_TOPICS = 8;

export function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([]);
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMorePosts = useCallback(async (currentPage: number, topicIds?: string[]) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      const newPosts = await postService.getPosts(currentPage, LIMIT, topicIds);
      if (newPosts.length < LIMIT) setHasMore(false);
      setPosts(prev => currentPage === 1 ? newPosts : [...prev, ...newPosts]);
      setPage(currentPage + 1);
    } catch {
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadMorePosts(1);
    topicService.getTopics().then(setTopics);
    userService.getRecommendedUsers().then(setRecommendedUsers).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sentinel = observerRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          setPage(prev => { loadMorePosts(prev, selectedTopics.map(t => t._id)); return prev; });
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMorePosts, selectedTopics]);

  function handleTopicClick(topic: Topic) {
    const isSelected = selectedTopics.some(t => t._id === topic._id);
    const next = isSelected
      ? selectedTopics.filter(t => t._id !== topic._id)
      : [...selectedTopics, topic];
    setSelectedTopics(next);
    setPosts([]);
    setPage(1);
    setHasMore(true);
    loadingRef.current = false;
    loadMorePosts(1, next.map(t => t._id));
  }

  const featuredPosts = selectedTopics.length > 0 ? [] : posts.slice(0, 3);
  const gridPosts = selectedTopics.length > 0 ? posts : posts.slice(3);
  const visibleTopics = showAllTopics ? topics : topics.slice(0, VISIBLE_TOPICS);

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-10 flex gap-12">
        <main className="flex-1 min-w-0">
          {featuredPosts.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Featured</h2>
              <div className="space-y-4">
                {featuredPosts.map(post => (
                  <FeaturedPostCard
                    key={post._id}
                    post={post}
                    authorEmail={typeof post.authorId === 'object' ? post.authorId.email : '…'}
                    authorId={typeof post.authorId === 'object' ? post.authorId._id : post.authorId}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            {selectedTopics.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {selectedTopics.map(t => (
                  <span key={t._id} className="flex items-center gap-1 bg-foreground text-background text-sm px-3 py-1 rounded-full">
                    {t.name}
                    <button onClick={() => handleTopicClick(t)} className="ml-1 hover:opacity-70 transition-opacity">×</button>
                  </span>
                ))}
                <button
                  onClick={() => { setSelectedTopics([]); setPosts([]); setPage(1); setHasMore(true); loadingRef.current = false; loadMorePosts(1); }}
                  className="text-xs text-muted-foreground hover:text-foreground border rounded-full px-2.5 py-0.5 transition-colors"
                >
                  Clear all
                </button>
              </div>
            ) : (
              posts.length > 3 && <h2 className="text-2xl font-bold mb-6">Latest</h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  authorEmail={typeof post.authorId === 'object' ? post.authorId.email : '…'}
                  authorId={typeof post.authorId === 'object' ? post.authorId._id : post.authorId}
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
            {!isLoading && !hasMore && posts.length === 0 && (
              <p className="text-center text-muted-foreground text-sm mt-10">
                No posts found for the selected topics.
              </p>
            )}
            {!hasMore && posts.length > 0 && (
              <p className="text-center text-muted-foreground text-sm mt-10">
                You've reached the end.
              </p>
            )}
          </section>

          <div ref={observerRef} className="h-4 mt-4" />
        </main>

        <aside className="w-72 shrink-0 hidden lg:block">
          {recommendedUsers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-foreground mb-4">People you might like</h3>
              <div className="space-y-3">
                {recommendedUsers.map(user => (
                  <RecommendedUserRow key={user._id} user={user} />
                ))}
              </div>
            </div>
          )}
          <h3 className="text-sm font-semibold text-foreground mb-4">Recommended topics</h3>
          <div className="flex flex-wrap gap-2">
            {visibleTopics.map(topic => (
              <button
                key={topic._id}
                onClick={() => handleTopicClick(topic)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedTopics.some(t => t._id === topic._id)
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-foreground hover:bg-muted/70'
                }`}
              >
                {topic.name}
              </button>
            ))}
          </div>
          {topics.length > VISIBLE_TOPICS && (
            <button
              onClick={() => setShowAllTopics(v => !v)}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAllTopics ? 'Show less' : 'See more topics'}
            </button>
          )}
        </aside>
      </div>
    </PageLayout>
  );
}

function FeaturedPostCard({ post, authorEmail, authorId }: { post: Post; authorEmail: string; authorId: string }) {
  const excerptSource = post.summary ?? stripMarkdown(post.text);
  const excerpt = excerptSource.length > 200 ? excerptSource.slice(0, 200) + '…' : excerptSource;
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
        <AuthorBadge email={authorEmail} date={date} authorId={authorId} />
        <h3 className="text-lg font-bold leading-snug mt-2 mb-2 group-hover:underline line-clamp-2">
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
