import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '@/services/chatService';

export function useStartChat() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const inFlightRef = useRef(false);

  async function startChat(targetUserId: string, title = 'Chat') {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsLoading(true);
    try {
      const chat = await chatService.createChat(title, [targetUserId]);
      navigate('/messages/' + chat._id);
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }

  return { startChat, isLoading };
}
