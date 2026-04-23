import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL as string;

export function useSocket(): Socket {
  const socketRef = useRef<Socket | null>(null);

  if (!socketRef.current) {
    // autoConnect: false so the socket only connects when we explicitly call
    // socket.connect() inside the effect — this makes it safe under React
    // Strict Mode, which runs cleanup+setup twice in development.
    socketRef.current = io(BACKEND_URL, { autoConnect: false });
  }

  useEffect(() => {
    const socket = socketRef.current!;
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef.current;
}
