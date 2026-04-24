import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL as string;

export function useSocket(): Socket {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const tokenRef = useRef<string | null>(null);

  // Recreate the socket instance when the token changes so the new JWT is
  // sent in the handshake auth payload (the backend io.use() middleware
  // reads socket.handshake.auth.token and rejects connections without it).
  if (!socketRef.current || tokenRef.current !== token) {
    socketRef.current?.disconnect();
    socketRef.current = io(BACKEND_URL, {
      autoConnect: false,
      auth: { token: token ?? '' },
    });
    tokenRef.current = token;
  }

  useEffect(() => {
    const socket = socketRef.current!;
    socket.connect();
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
    return () => {
      socket.disconnect();
    };
  }, [token]);

  return socketRef.current;
}
