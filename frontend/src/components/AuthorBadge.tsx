import { useState } from 'react';
import { useUser } from '@/context/UserContext';

interface AuthorBadgeProps {
  email: string;
  date: string;
  authorId?: string;
  showFollow?: boolean;
  isCurrentUser?: boolean;
}

export function AuthorBadge({ email, date, authorId, showFollow = false, isCurrentUser = false }: AuthorBadgeProps) {
  const { isFollowing, follow, unfollow } = useUser();
  const following = authorId ? isFollowing(authorId) : false;
  const [isPending, setIsPending] = useState(false);
  const initial = email ? email[0].toUpperCase() : '?';

  async function handleFollowClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!authorId || isPending) return;
    setIsPending(true);
    try {
      following ? await unfollow(authorId) : await follow(authorId);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center text-sm font-semibold shrink-0 select-none">
        {initial}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-foreground">{email}</span>
        {showFollow && !isCurrentUser && !!authorId && (
          <button
            type="button"
            onClick={handleFollowClick}
            disabled={isPending}
            className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors disabled:opacity-50 ${
              following
                ? 'border-muted-foreground/40 text-muted-foreground hover:border-destructive hover:text-destructive'
                : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
            }`}
          >
            {following ? 'Following' : 'Follow'}
          </button>
        )}
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
    </div>
  );
}
