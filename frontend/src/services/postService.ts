import api from '@/services/axiosInstance';
import type { Post } from '@/types';

export const postService = {
  async getPosts(page: number, limit = 10, topicIds?: string[]): Promise<Post[]> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (topicIds && topicIds.length > 0) {
      topicIds.forEach(id => params.append('topics', id));
    }
    const res = await api.get<Post[]>('/posts', { params });
    return res.data;
  },

  async getPostsByAuthor(authorId: string): Promise<Post[]> {
    const res = await api.get<Post[]>('/posts', { params: { authorId, limit: 100 } });
    return res.data;
  },

  async getPostsByAuthors(authorIds: string[], page = 1, limit = 10): Promise<Post[]> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    authorIds.forEach(id => params.append('authorId', id));
    const res = await api.get<Post[]>('/posts', { params });
    return res.data;
  },

  async getPostById(id: string): Promise<Post> {
    const res = await api.get<Post>(`/posts/${id}`);
    return res.data;
  },

  async createPost(data: { title: string; text: string; image?: string; topics?: string[] }): Promise<Post> {
    const res = await api.post<Post>('/posts', data);
    return res.data;
  },

  async updatePost(id: string, data: { title: string; text: string; image?: string; topics?: string[] }): Promise<Post> {
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
