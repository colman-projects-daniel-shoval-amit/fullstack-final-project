import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useStartChat } from '@/hooks/useStartChat';
import type { RecommendedUser } from '@/types';

export function RecommendedUserRow({ user }: { user: RecommendedUser }) {
  const { isFollowing, follow, unfollow, profile } = useUser();
  const { startChat, isLoading: isChatLoading } = useStartChat();
  const [isPending, setIsPending] = useState(false);
  const following = isFollowing(user._id);
  const isSelf = profile?._id === user._id;

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
      <span className="flex-1 text-sm text-foreground truncate">{user.email}</span>
      {!isSelf && (
        <button
          onClick={() => startChat(user._id, `Chat with ${user.email}`)}
          disabled={isChatLoading}
          title="Send message"
          className="text-muted-foreground hover:text-primary transition-colors shrink-0 disabled:opacity-50 p-0.5"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
      )}
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
