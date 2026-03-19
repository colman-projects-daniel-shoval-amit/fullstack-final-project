import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenSquare } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { PostCard } from '@/components/PostCard';
import { PostCardSkeleton } from '@/components/PostCardSkeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { postService } from '@/services/postService';
import type { Post } from '@/types';

export function MyPostsPage() {
  const { userId } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    postService.getPosts(1, 100, { authorId: userId })
      .then(setPosts)
      .finally(() => setIsLoading(false));
  }, [userId]);

  return (
    <PageLayout>
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">My Posts</h1>
          <Button asChild size="sm">
            <Link to="/posts/new">
              <PenSquare className="w-4 h-4 mr-1" />
              Write
            </Link>
          </Button>
        </div>

        {!isLoading && posts.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="mb-4">You haven't written anything yet.</p>
            <Button asChild>
              <Link to="/posts/new">Write your first post</Link>
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && (
            <>
              <PostCardSkeleton />
              <PostCardSkeleton />
              <PostCardSkeleton />
            </>
          )}
          {posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              authorEmail={typeof post.authorId === 'object' ? post.authorId.email : ''}
            />
          ))}
        </div>
      </main>
    </PageLayout>
  );
}
