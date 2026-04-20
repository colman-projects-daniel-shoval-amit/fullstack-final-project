import api from '@/services/axiosInstance';
import type { Like } from '@/types';

export const likeService = {
  async getLikesForPost(postId: string, userId: string): Promise<Like[]> {
    const res = await api.get<Like[]>('/likes', { params: { postId, userId } });
    return res.data;
  },

  async likePost(postId: string): Promise<Like> {
    const res = await api.post<Like>('/likes', { postId });
    return res.data;
  },

  async unlikePost(likeId: string): Promise<void> {
    await api.delete(`/likes/${likeId}`);
  },
};
