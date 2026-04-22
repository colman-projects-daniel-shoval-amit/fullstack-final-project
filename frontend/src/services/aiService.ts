import api from '@/services/axiosInstance';

export const aiService = {
  async assist(title: string, content: string, instruction: 'improve' | 'continue' | 'outline'): Promise<string> {
    const res = await api.post<{ result: string }>('/ai/assist', { title, content, instruction });
    return res.data.result;
  },

  async summarize(title: string, content: string): Promise<string> {
    const res = await api.post<{ summary: string }>('/ai/summarize', { title, content });
    return res.data.summary;
  },

  async suggestTopics(title: string, content: string, topics: { _id: string; name: string }[]): Promise<string[]> {
    const res = await api.post<{ topicIds: string[] }>('/ai/suggest-topics', { title, content, topics });
    return res.data.topicIds;
  },
};
