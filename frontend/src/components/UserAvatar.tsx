import { resolveImageUrl } from '@/lib/utils';

interface UserAvatarProps {
  email: string;
  avatar?: string;
  className?: string;
}

export function UserAvatar({ email, avatar, className = '' }: UserAvatarProps) {
  const src = resolveImageUrl(avatar);
  const initial = email?.[0]?.toUpperCase() ?? '?';
  const base = `rounded-full shrink-0 ${className}`;

  if (src) {
    return <img src={src} alt={email} className={`${base} object-cover`} />;
  }
  return (
    <div className={`${base} flex items-center justify-center font-semibold select-none`}>
      {initial}
    </div>
  );
}
