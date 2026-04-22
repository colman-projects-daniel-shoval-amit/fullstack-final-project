import { useEffect, useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { PostCard } from '@/components/PostCard';
import { PostCardSkeleton } from '@/components/PostCardSkeleton';
import { useUser } from '@/context/UserContext';
import { postService } from '@/services/postService';
import type { Post } from '@/types';

export function FollowingPage() {
  const { profile } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const followingIds = (profile?.following ?? []).map(u => u._id);

  useEffect(() => {
    if (followingIds.length === 0) {
      setPosts([]);
      return;
    }
    setIsLoading(true);
    postService.getPostsByAuthors(followingIds)
      .then(setPosts)
      .finally(() => setIsLoading(false));
  }, [followingIds.join(',')]);

  return (
    <PageLayout>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-8">Following</h1>
        {!isLoading && followingIds.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Follow some authors to see their posts here.
          </p>
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
        </div>
      </main>
    </PageLayout>
  );
}
