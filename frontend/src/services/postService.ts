import api from '@/services/axiosInstance';
import type { Post } from '@/types';

export const postService = {
  async getPosts(page: number, limit = 10, filter?: Record<string, string>): Promise<Post[]> {
    const res = await api.get<Post[]>('/posts', { params: { page, limit, ...filter } });
    return res.data;
  },

  async getPostById(id: string): Promise<Post> {
    const res = await api.get<Post>(`/posts/${id}`);
    return res.data;
  },

  async createPost(data: { title: string; text: string; image?: string }): Promise<Post> {
    const res = await api.post<Post>('/posts', data);
    return res.data;
  },

  async updatePost(id: string, data: { title: string; text: string; image?: string }): Promise<Post> {
    const res = await api.put<Post>(`/posts/${id}`, data);
    return res.data;
  },

  async uploadImage(file: File): Promise<string> {
    const form = new FormData();
    form.append('image', file);
    const res = await api.post<{ url: string }>('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  },
};
