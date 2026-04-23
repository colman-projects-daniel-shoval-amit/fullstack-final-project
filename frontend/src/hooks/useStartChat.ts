import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '@/services/chatService';

export function useStartChat() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  async function startChat(targetUserId: string, title = 'Chat') {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const chat = await chatService.createChat(title, [targetUserId]);
      navigate('/messages/' + chat._id);
    } finally {
      setIsLoading(false);
    }
  }

  return { startChat, isLoading };
}
