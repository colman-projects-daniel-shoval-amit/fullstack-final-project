import api from '@/services/axiosInstance';

export interface Topic {
  _id: string;
  name: string;
  slug: string;
}

export const topicService = {
  async getTopics(): Promise<Topic[]> {
    const res = await api.get<Topic[]>('/topics', { params: { limit: 100 } });
    return res.data;
  },
};
