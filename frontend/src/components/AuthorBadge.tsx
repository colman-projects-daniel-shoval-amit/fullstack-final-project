import { useState } from 'react';

interface AuthorBadgeProps {
  email: string;
  date: string;
  showFollow?: boolean;
  isCurrentUser?: boolean;
}

export function AuthorBadge({ email, date, showFollow = false, isCurrentUser = false }: AuthorBadgeProps) {
  const [following, setFollowing] = useState(false);
  const initial = email ? email[0].toUpperCase() : '?';

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center text-sm font-semibold shrink-0 select-none">
        {initial}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-foreground">{email}</span>
        {showFollow && !isCurrentUser && (
          <button
            type="button"
            onClick={e => { e.preventDefault(); e.stopPropagation(); setFollowing(v => !v); }}
            className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
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
