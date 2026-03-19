import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getDateFromId, resolveImageUrl } from '@/lib/utils';
import type { Post } from '@/types';

interface PostCardProps {
  post: Post;
  authorEmail: string;
}

export function PostCard({ post, authorEmail }: PostCardProps) {
  const excerpt = post.text.length > 150 ? post.text.slice(0, 150) + '…' : post.text;
  const date = getDateFromId(post._id).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link to={`/posts/${post._id}`} className="block group">
      <Card className="h-full flex flex-col overflow-hidden transition-shadow group-hover:shadow-md">
        {post.image && (
          <img
            src={resolveImageUrl(post.image)}
            alt={post.title}
            className="w-full h-48 object-cover"
          />
        )}
        <CardHeader className="flex-none">
          <CardDescription className="text-xs">
            {authorEmail} · {date}
          </CardDescription>
          <CardTitle className="text-lg leading-snug line-clamp-2">
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-muted-foreground text-sm line-clamp-3">{excerpt}</p>
        </CardContent>
        <CardFooter className="flex gap-4 text-muted-foreground text-sm">
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {post.likesCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {post.commentsCount}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
