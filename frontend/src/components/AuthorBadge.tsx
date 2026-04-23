import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useStartChat } from '@/hooks/useStartChat';

interface AuthorBadgeProps {
  email: string;
  date: string;
  authorId?: string;
  showFollow?: boolean;
  isCurrentUser?: boolean;
}

export function AuthorBadge({ email, date, authorId, showFollow = false, isCurrentUser = false }: AuthorBadgeProps) {
  const { isFollowing, follow, unfollow, profile } = useUser();
  const { startChat, isLoading: isChatLoading } = useStartChat();
  const following = authorId ? isFollowing(authorId) : false;
  const [isPending, setIsPending] = useState(false);
  const initial = email ? email[0].toUpperCase() : '?';
  const isSelf = !!(authorId && profile?._id === authorId);

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

  async function handleMessageClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!authorId) return;
    await startChat(authorId, `Chat with ${email}`);
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center text-sm font-semibold shrink-0 select-none">
        {initial}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-foreground">{email}</span>
        {showFollow && !isCurrentUser && !isSelf && !!authorId && (
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
        {!isSelf && !!authorId && (
          <button
            type="button"
            onClick={handleMessageClick}
            disabled={isChatLoading}
            title="Send message"
            className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        )}
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
    </div>
  );
}
