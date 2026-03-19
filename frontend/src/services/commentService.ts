import api from '@/services/axiosInstance';
import type { Comment } from '@/types';

export const commentService = {
  async getComments(postId: string, page: number, limit = 10): Promise<Comment[]> {
    const res = await api.get<Comment[]>('/comments', { params: { postId, page, limit } });
    return res.data;
  },

  async createComment(postId: string, content: string): Promise<Comment> {
    const res = await api.post<Comment>('/comments', { postId, content });
    return res.data;
  },

  async updateComment(id: string, content: string): Promise<Comment> {
    const res = await api.put<Comment>(`/comments/${id}`, { content });
    return res.data;
  },

  async deleteComment(id: string): Promise<void> {
    await api.delete(`/comments/${id}`);
  },
};
