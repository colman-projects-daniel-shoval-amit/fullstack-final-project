import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUser } from '@/context/UserContext';
import { useSocket } from '@/hooks/useSocket';
import { chatService } from '@/services/chatService';
import type { Message } from '@/types';

interface ChatNotificationContextValue {
  unreadChatIds: Set<string>;
  markChatAsRead: (chatId: string) => void;
}

const ChatNotificationContext = createContext<ChatNotificationContextValue | null>(null);

export function ChatNotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const { profile } = useUser();
  const socket = useSocket();
  const [unreadChatIds, setUnreadChatIds] = useState<Set<string>>(new Set());

  // Fetch initial unread state whenever auth changes
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadChatIds(new Set());
      return;
    }
    chatService.getUnreadChatIds()
      .then(ids => setUnreadChatIds(new Set(ids)))
      .catch(() => {});
  }, [isAuthenticated, token]);

  // This context has its own socket instance (each useSocket() call owns a ref).
  // We must emit join_user_room here so the backend adds this socket to the
  // user's personal room — otherwise chat_list_update events never arrive.
  useEffect(() => {
    if (!profile?._id) return;
    const userId = profile._id;
    function joinRoom() {
      socket.emit('join_user_room', userId);
    }
    if (socket.connected) joinRoom();
    socket.on('connect', joinRoom);
    return () => { socket.off('connect', joinRoom); };
  }, [socket, profile?._id]);

  // Listen for incoming messages and increment the global badge
  useEffect(() => {
    const currentUserId = profile?._id;
    function handler(msg: Message) {
      console.log('Global Context received message:', msg);

      // Ignore messages sent by the current user
      if (msg.senderId === currentUserId) return;

      // Do not count a chat the user is currently viewing
      const activeChatId = window.location.pathname.startsWith('/messages/')
        ? window.location.pathname.split('/messages/')[1]
        : null;
      if (activeChatId && activeChatId === msg.chatId) return;

      setUnreadChatIds(prev => {
        if (prev.has(msg.chatId)) return prev;
        const next = new Set(prev);
        next.add(msg.chatId);
        return next;
      });
    }
    socket.on('chat_list_update', handler);
    return () => { socket.off('chat_list_update', handler); };
  }, [socket, profile?._id]);

  const markChatAsRead = useCallback((chatId: string) => {
    setUnreadChatIds(prev => {
      if (!prev.has(chatId)) return prev;
      const next = new Set(prev);
      next.delete(chatId);
      return next;
    });
  }, []);

  return (
    <ChatNotificationContext.Provider value={{ unreadChatIds, markChatAsRead }}>
      {children}
    </ChatNotificationContext.Provider>
  );
}

export function useChatNotification(): ChatNotificationContextValue {
  const ctx = useContext(ChatNotificationContext);
  if (!ctx) throw new Error('useChatNotification must be used inside ChatNotificationProvider');
  return ctx;
}
