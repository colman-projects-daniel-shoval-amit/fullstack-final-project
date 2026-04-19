import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { userService } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';
import type { UserProfile } from '@/types';

interface UserContextValue {
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  isFollowing: (userId: string) => boolean;
  follow: (userId: string) => Promise<void>;
  unfollow: (userId: string) => Promise<void>;
  setProfile: (profile: UserProfile) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null);
      return;
    }
    setIsLoadingProfile(true);
    userService.getMe()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setIsLoadingProfile(false));
  }, [isAuthenticated]);

  const isFollowing = useCallback((userId: string) => {
    return (profile?.following ?? []).some(u => u._id === userId);
  }, [profile]);

  const follow = useCallback(async (userId: string) => {
    await userService.followUser(userId);
    setProfile(prev => {
      if (!prev) return prev;
      if (prev.following.some(u => u._id === userId)) return prev;
      return { ...prev, following: [...prev.following, { _id: userId, email: '' }] };
    });
  }, []);

  const unfollow = useCallback(async (userId: string) => {
    await userService.unfollowUser(userId);
    setProfile(prev => {
      if (!prev) return prev;
      return { ...prev, following: prev.following.filter(u => u._id !== userId) };
    });
  }, []);

  return (
    <UserContext.Provider value={{ profile, isLoadingProfile, isFollowing, follow, unfollow, setProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
}
