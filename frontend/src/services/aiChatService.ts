import api from '@/services/axiosInstance';

type AskResponse = {
  answer: string;
};

export const aiChatService = {
  async ask(question: string): Promise<string> {
    const res = await api.post<AskResponse>('/aichat/ask', {
      question,
    });

    return res.data.answer;
  },
};