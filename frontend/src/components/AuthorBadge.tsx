import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useStartChat } from '@/hooks/useStartChat';
import { UserAvatar } from '@/components/UserAvatar';

interface AuthorBadgeProps {
  email: string;
  date: string;
  authorId?: string;
  avatar?: string;
  showFollow?: boolean;
}

export function AuthorBadge({ email, date, authorId, avatar, showFollow = false }: AuthorBadgeProps) {
  const { isFollowing, follow, unfollow, profile } = useUser();
  const { startChat, isLoading: isChatLoading } = useStartChat();
  const following = authorId ? isFollowing(authorId) : false;
  const [isPending, setIsPending] = useState(false);
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
    if (!authorId) return;
    await startChat(authorId, `Chat with ${email}`);
  }

  return (
    <div className="flex items-center gap-2.5">
      <UserAvatar email={email} avatar={avatar} className="w-8 h-8 bg-muted text-foreground text-sm" />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-foreground">{email}</span>
        {showFollow && !isSelf && !!authorId && (
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
