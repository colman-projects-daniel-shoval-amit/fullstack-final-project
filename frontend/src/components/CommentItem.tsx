import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Comment } from '@/types';
import { useStartChat } from '@/hooks/useStartChat';

interface CommentItemProps {
  comment: Comment;
  authorEmail: string;
  currentUserId: string | null;
  onDelete: (id: string) => void;
}

export function CommentItem({ comment, authorEmail, currentUserId, onDelete }: CommentItemProps) {
  const isOwner = currentUserId === comment.authorId;
  const { startChat, isLoading } = useStartChat();
  const canMessage = !!comment.authorId && comment.authorId !== currentUserId;

  return (
    <div className="flex gap-3 py-4 border-b last:border-0">
      <div
        className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0 ${canMessage ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
        onClick={canMessage && !isLoading ? () => startChat(comment.authorId, `Chat with ${authorEmail}`) : undefined}
        title={canMessage ? 'Send message' : undefined}
        role={canMessage ? 'button' : undefined}
      >
        {authorEmail[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">{authorEmail}</span>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(comment._id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
}
