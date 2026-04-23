import { useEffect, useRef, useState } from 'react';
import { Send, Plus, MessageSquare } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUser } from '@/context/UserContext';
import { chatService } from '@/services/chatService';
import { useSocket } from '@/hooks/useSocket';
import type { Chat, Message, User } from '@/types';

export function MessagesPage() {
  const { profile } = useUser();
  const socket = useSocket();

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Load user's chats on mount
  useEffect(() => {
    if (!profile?._id) return;
    chatService.getMyChats(profile._id)
      .then(setChats)
      .catch(() => {});
  }, [profile?._id]);

  // Load messages and join socket room when active chat changes
  useEffect(() => {
    if (!activeChatId) return;
    setIsLoadingMessages(true);
    chatService.getChatWithMessages(activeChatId)
      .then(chat => setMessages(chat.messages ?? []))
      .catch(() => setMessages([]))
      .finally(() => setIsLoadingMessages(false));

    socket.emit('join_chat', activeChatId);
  }, [activeChatId, socket]);

  // Listen for incoming messages from other users
  useEffect(() => {
    function handleNewMessage(msg: Message) {
      if (msg.chatId !== activeChatId) return;
      // Deduplicate: the sender already added the message optimistically
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    }
    socket.on('new_message', handleNewMessage);
    return () => { socket.off('new_message', handleNewMessage); };
  }, [socket, activeChatId]);

  // Re-join the active room after a socket reconnect
  useEffect(() => {
    if (!activeChatId) return;
    function handleReconnect() {
      socket.emit('join_chat', activeChatId);
    }
    socket.on('connect', handleReconnect);
    return () => { socket.off('connect', handleReconnect); };
  }, [socket, activeChatId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!activeChatId || !inputText.trim() || isSending) return;
    const text = inputText.trim();
    setInputText('');
    setIsSending(true);
    try {
      const sent = await chatService.sendMessage(activeChatId, text);
      // Deduplicate: if the socket event arrived before the REST response
      // resolved, the message is already in state — don't add it twice.
      setMessages(prev => prev.some(m => m._id === sent._id) ? prev : [...prev, sent]);
    } catch {
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function openNewChatDialog() {
    setShowNewChatDialog(true);
    if (allUsers.length === 0) {
      chatService.getAllUsers()
        .then(users => setAllUsers(users.filter(u => u._id !== profile?._id)))
        .catch(() => {});
    }
  }

  async function handleStartChat(user: User) {
    if (isCreatingChat) return;
    setIsCreatingChat(true);
    try {
      const chat = await chatService.createChat(`Chat with ${user.email}`, [user._id]);
      setChats(prev => {
        if (prev.some(c => c._id === chat._id)) return prev;
        return [chat, ...prev];
      });
      setActiveChatId(chat._id);
      setShowNewChatDialog(false);
    } finally {
      setIsCreatingChat(false);
    }
  }

  const activeChat = chats.find(c => c._id === activeChatId);

  return (
    <PageLayout>
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

        {/* Left sidebar — chat list */}
        <div className="w-72 border-r flex flex-col shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="font-semibold text-sm">Messages</h2>
            <Button variant="ghost" size="icon" onClick={openNewChatDialog} title="New chat">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center mt-8 px-4">
                No chats yet. Start one with the + button.
              </p>
            ) : (
              chats.map(chat => (
                <button
                  key={chat._id}
                  onClick={() => setActiveChatId(chat._id)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-muted/50 ${
                    chat._id === activeChatId ? 'bg-muted font-medium' : 'text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                      {chat.title?.[0]?.toUpperCase() ?? '#'}
                    </div>
                    <span className="truncate">{chat.title}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right panel — chat window */}
        {activeChatId ? (
          <div className="flex flex-col flex-1 min-w-0">
            {/* Header */}
            <div className="px-5 py-3 border-b shrink-0">
              <p className="font-semibold text-sm">{activeChat?.title ?? '…'}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {isLoadingMessages ? (
                <div className="flex justify-center pt-8">
                  <span className="text-sm text-muted-foreground">Loading…</span>
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground pt-8">
                  No messages yet. Say hello!
                </p>
              ) : (
                messages.map(msg => (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    isMine={msg.senderId === profile?._id}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t shrink-0 flex items-center gap-2">
              <Input
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                className="flex-1"
                disabled={isSending}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!inputText.trim() || isSending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageSquare className="w-10 h-10 opacity-30" />
            <p className="text-sm">Select a chat or start a new one</p>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New conversation</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-3">
            Select a person to start chatting with.
          </p>
          <div className="max-h-72 overflow-y-auto space-y-1">
            {allUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading users…</p>
            ) : (
              allUsers.map(user => (
                <button
                  key={user._id}
                  onClick={() => handleStartChat(user)}
                  disabled={isCreatingChat}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="text-sm truncate">{user.email}</span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
          isMine
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        }`}
      >
        <p>{message.content}</p>
        <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
          {time}
        </p>
      </div>
    </div>
  );
}
