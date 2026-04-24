import api from '@/services/axiosInstance';
import type { Chat, Message, User } from '@/types';

export const chatService = {
  async getMyChats(userId: string): Promise<Chat[]> {
    const res = await api.get<Chat[]>(`/chats/user/${userId}`);
    return res.data;
  },

  async getChatWithMessages(chatId: string): Promise<Chat> {
    const res = await api.get<Chat>(`/chats/${chatId}`);
    return res.data;
  },

  async createChat(title: string, participantIds: string[]): Promise<Chat> {
    const res = await api.post<Chat>('/chats', { title, participants: participantIds });
    return res.data;
  },

  async sendMessage(chatId: string, content: string): Promise<Message> {
    const res = await api.post<Message>('/messages', { chatId, content });
    return res.data;
  },

  async getAllUsers(): Promise<User[]> {
    const res = await api.get<User[]>('/users', { params: { limit: 100 } });
    return res.data;
  },

  async markChatRead(chatId: string): Promise<void> {
    await api.put(`/chats/${chatId}/read`);
  },

  async getUnreadChatIds(): Promise<string[]> {
    const res = await api.get<{ unreadChatIds: string[] }>('/chats/unread');
    return res.data.unreadChatIds;
  },
};
