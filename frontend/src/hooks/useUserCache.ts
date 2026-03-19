import { useState, useCallback } from 'react';
import { userService } from '@/services/userService';
import type { User } from '@/types';

export function useUserCache() {
  const [cache, setCache] = useState<Record<string, User>>({});

  const getUser = useCallback(async (id: string): Promise<User> => {
    if (cache[id]) return cache[id];
    const user = await userService.getUserById(id);
    setCache(prev => ({ ...prev, [id]: user }));
    return user;
  }, [cache]);

  const loadUsers = useCallback(async (ids: string[]): Promise<void> => {
    const missing = ids.filter(id => !cache[id]);
    if (missing.length === 0) return;
    const users = await Promise.all(missing.map(id => userService.getUserById(id)));
    setCache(prev => {
      const next = { ...prev };
      missing.forEach((id, i) => { next[id] = users[i]; });
      return next;
    });
  }, [cache]);

  return { cache, getUser, loadUsers };
}
