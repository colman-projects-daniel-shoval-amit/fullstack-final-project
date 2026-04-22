import api from '@/services/axiosInstance';
import type { User, UserProfile, RecommendedUser } from '@/types';

export const userService = {
  async getUserById(id: string): Promise<User> {
    const res = await api.get<User>(`/users/${id}`);
    return res.data;
  },

  async getMe(): Promise<UserProfile> {
    const res = await api.get<UserProfile>('/users/me');
    return res.data;
  },

  async updateInterests(interestIds: string[]): Promise<UserProfile> {
    const res = await api.patch<UserProfile>('/users/me', { interests: interestIds });
    return res.data;
  },

  async followUser(userId: string): Promise<void> {
    await api.post(`/users/${userId}/follow`);
  },

  async unfollowUser(userId: string): Promise<void> {
    await api.delete(`/users/${userId}/follow`);
  },

  async getRecommendedUsers(): Promise<RecommendedUser[]> {
    const res = await api.get<RecommendedUser[]>('/users/recommended');
    return res.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.patch('/users/me/password', { currentPassword, newPassword });
  },

  async uploadAvatar(file: File): Promise<UserProfile> {
    const form = new FormData();
    form.append('image', file);
    const res = await api.post<UserProfile>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
