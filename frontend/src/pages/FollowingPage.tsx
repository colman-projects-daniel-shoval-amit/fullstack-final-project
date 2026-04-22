import { useEffect, useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { PostCard } from '@/components/PostCard';
import { PostCardSkeleton } from '@/components/PostCardSkeleton';
import { useUser } from '@/context/UserContext';
import { userService } from '@/services/userService';
import { postService } from '@/services/postService';
import type { Post, RecommendedUser } from '@/types';

export function FollowingPage() {
  const { profile } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([]);

  const followingIds = (profile?.following ?? []).map(u => u._id);

  useEffect(() => {
    if (followingIds.length === 0) {
      userService.getRecommendedUsers().then(setRecommendedUsers).catch(() => {});
      setPosts([]);
      return;
    }
    setIsLoading(true);
    postService.getPostsByAuthors(followingIds)
      .then(setPosts)
      .finally(() => setIsLoading(false));
  }, [followingIds.join(',')]);

  const isEmpty = !isLoading && followingIds.length === 0;

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-12 flex gap-12">

        <main className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold mb-8">Following</h1>

          {isEmpty && (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-2">You're not following anyone yet.</p>
              <p className="text-sm text-muted-foreground">Follow authors to see their posts here.</p>
              {recommendedUsers.length > 0 && (
                <div className="mt-10 text-left max-w-sm mx-auto">
                  <h3 className="text-sm font-semibold mb-4">People you might like</h3>
                  <div className="space-y-3">
                    {recommendedUsers.map(user => (
                      <RecommendedUserRow key={user._id} user={user} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {isLoading && [1, 2, 3].map(k => <PostCardSkeleton key={k} />)}
            {posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                authorEmail={typeof post.authorId === 'object' ? post.authorId.email : '…'}
                authorId={typeof post.authorId === 'object' ? post.authorId._id : post.authorId}
              />
            ))}
            {!isLoading && followingIds.length > 0 && posts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                The people you follow haven't posted anything yet.
              </p>
            )}
          </div>
        </main>

        {followingIds.length > 0 && (
          <aside className="w-64 shrink-0 hidden lg:block">
            <h3 className="text-sm font-semibold mb-4">Who you follow</h3>
            <div className="space-y-3">
              {(profile?.following ?? []).map(user => (
                <FollowingRow key={user._id} userId={user._id} email={user.email} />
              ))}
            </div>
          </aside>
        )}

      </div>
    </PageLayout>
  );
}

function FollowingRow({ userId, email }: { userId: string; email: string }) {
  const { unfollow } = useUser();
  const [isPending, setIsPending] = useState(false);

  async function handleUnfollow() {
    if (isPending) return;
    setIsPending(true);
    try {
      await unfollow(userId);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center text-sm font-semibold shrink-0 select-none">
        {email?.[0]?.toUpperCase() ?? '?'}
      </div>
      <span className="flex-1 text-sm truncate">{email}</span>
      <button
        onClick={handleUnfollow}
        disabled={isPending}
        className="text-xs px-2.5 py-0.5 rounded-full border border-muted-foreground/40 text-muted-foreground hover:border-destructive hover:text-destructive transition-colors shrink-0 disabled:opacity-50"
      >
        Unfollow
      </button>
    </div>
  );
}

function RecommendedUserRow({ user }: { user: RecommendedUser }) {
  const { isFollowing, follow, unfollow } = useUser();
  const [isPending, setIsPending] = useState(false);
  const following = isFollowing(user._id);

  async function handleClick() {
    if (isPending) return;
    setIsPending(true);
    try {
      following ? await unfollow(user._id) : await follow(user._id, user.email);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center text-sm font-semibold shrink-0 select-none">
        {user.email?.[0]?.toUpperCase() ?? '?'}
      </div>
      <span className="flex-1 text-sm truncate">{user.email}</span>
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors shrink-0 disabled:opacity-50 ${
          following
            ? 'border-muted-foreground/40 text-muted-foreground hover:border-destructive hover:text-destructive'
            : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
        }`}
      >
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}
