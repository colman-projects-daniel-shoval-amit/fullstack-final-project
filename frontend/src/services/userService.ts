import api from '@/services/axiosInstance';
import type { User } from '@/types';

export const userService = {
  async getUserById(id: string): Promise<User> {
    const res = await api.get<User>(`/users/${id}`);
    return res.data;
  },
};
