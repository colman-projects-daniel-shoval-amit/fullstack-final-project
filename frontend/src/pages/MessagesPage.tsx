import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { UserAvatar } from '@/components/UserAvatar';
import type { Chat, Message, User } from '@/types';

export function MessagesPage() {
  const { profile } = useUser();
  const socket = useSocket();
  const { chatId = null } = useParams<{ chatId: string }>();
  const navigate = useNavigate();

  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  // Mirror chats state into a ref so socket event handlers can read the
  // current list without capturing a stale closure value.
  const chatsRef = useRef<Chat[]>([]);
  useEffect(() => { chatsRef.current = chats; }, [chats]);

  // Load user's chats on mount
  useEffect(() => {
    if (!profile?._id) return;
    chatService.getMyChats(profile._id)
      .then(setChats)
      .catch(() => {});
  }, [profile?._id]);

  // Join personal user room so sidebar broadcasts are received for all chats
  useEffect(() => {
    if (!profile?._id) return;
    socket.emit('join_user_room', profile._id);
  }, [socket, profile?._id]);

  // Load messages and join active chat room when chatId changes
  useEffect(() => {
    if (!chatId) return;
    setIsLoadingMessages(true);
    chatService.getChatWithMessages(chatId)
      .then(chat => setMessages(chat.messages ?? []))
      .catch(() => setMessages([]))
      .finally(() => setIsLoadingMessages(false));

    socket.emit('join_chat', chatId);
  }, [chatId, socket]);

  // Rejoin both rooms after a socket reconnect
  useEffect(() => {
    function handleReconnect() {
      if (profile?._id) socket.emit('join_user_room', profile._id);
      if (chatId) socket.emit('join_chat', chatId);
    }
    socket.on('connect', handleReconnect);
    return () => { socket.off('connect', handleReconnect); };
  }, [socket, profile?._id, chatId]);

  // new_message: append to the active chat window only
  useEffect(() => {
    function handleNewMessage(msg: Message) {
      if (msg.chatId !== chatId) return;
      // Deduplicate: the sender already added the message optimistically
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    }
    socket.on('new_message', handleNewMessage);
    return () => { socket.off('new_message', handleNewMessage); };
  }, [socket, chatId]);

  // chat_list_update: bump an existing chat to the top, or fetch + insert a
  // brand-new chat (i.e. the receiving end of a first message).
  useEffect(() => {
    function handleChatListUpdate(msg: Message) {
      if (chatsRef.current.some(c => c._id === msg.chatId)) {
        bumpChatToTop(msg.chatId);
      } else {
        chatService.getChatWithMessages(msg.chatId)
          .then(newChat => {
            setChats(prev => {
              if (prev.some(c => c._id === newChat._id)) return prev;
              return [newChat, ...prev];
            });
            // Subscribe to live events for this newly discovered room
            socket.emit('join_chat', newChat._id);
          })
          .catch(() => {});
      }
    }
    socket.on('chat_list_update', handleChatListUpdate);
    return () => { socket.off('chat_list_update', handleChatListUpdate); };
  }, [socket]);

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!chatId || !inputText.trim() || isSending) return;
    const text = inputText.trim();
    setInputText('');
    setIsSending(true);
    try {
      const sent = await chatService.sendMessage(chatId, text);
      // Deduplicate: if the socket event arrived before the REST response
      // resolved, the message is already in state — don't add it twice.
      setMessages(prev => prev.some(m => m._id === sent._id) ? prev : [...prev, sent]);
      bumpChatToTop(chatId);
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
      // Enrich participants immediately so getChatDisplayName works before the
      // next full reload (create endpoint returns raw ObjectIds, not objects).
      const enriched: Chat = {
        ...chat,
        participants: [
          { _id: profile!._id, email: profile!.email },
          { _id: user._id, email: user.email },
        ],
      };
      setChats(prev => {
        if (prev.some(c => c._id === chat._id)) return prev;
        return [enriched, ...prev];
      });
      navigate('/messages/' + chat._id);
      setShowNewChatDialog(false);
    } finally {
      setIsCreatingChat(false);
    }
  }

  function bumpChatToTop(cId: string) {
    setChats(prev => {
      const idx = prev.findIndex(c => c._id === cId);
      if (idx <= 0) return prev;
      const next = [...prev];
      next.unshift(next.splice(idx, 1)[0]);
      return next;
    });
  }

  const activeChat = chats.find(c => c._id === chatId);

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
              chats.map(chat => {
                const displayName = getChatDisplayName(chat, profile?._id);
                const avatarSrc = getChatAvatar(chat, profile?._id);
                return (
                  <button
                    key={chat._id}
                    onClick={() => navigate('/messages/' + chat._id)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-muted/50 ${
                      chat._id === chatId ? 'bg-muted font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <UserAvatar email={displayName} avatar={avatarSrc} className="w-8 h-8 bg-primary/10 text-primary text-xs" />
                      <span className="truncate">{displayName}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel — chat window */}
        {chatId ? (
          <div className="flex flex-col flex-1 min-w-0">
            {/* Header */}
            <div className="px-5 py-3 border-b shrink-0 flex items-center gap-2.5">
              {activeChat && (
                <UserAvatar
                  email={getChatDisplayName(activeChat, profile?._id)}
                  avatar={getChatAvatar(activeChat, profile?._id)}
                  className="w-8 h-8 bg-primary/10 text-primary text-xs"
                />
              )}
              <p className="font-semibold text-sm">{activeChat ? getChatDisplayName(activeChat, profile?._id) : '…'}</p>
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

function getChatDisplayName(chat: Chat, currentUserId: string | null | undefined): string {
  const others = chat.participants.filter(p => {
    const id = typeof p === 'string' ? p : p._id;
    return id !== currentUserId;
  });
  const named = others.filter((p): p is { _id: string; email: string; avatar?: string } => typeof p !== 'string');
  if (named.length === 0) return chat.title;
  return named.map(p => p.email).join(', ');
}

function getChatAvatar(chat: Chat, currentUserId: string | null | undefined): string | undefined {
  const others = chat.participants.filter(p => {
    const id = typeof p === 'string' ? p : p._id;
    return id !== currentUserId;
  });
  const named = others.filter((p): p is { _id: string; email: string; avatar?: string } => typeof p !== 'string');
  return named[0]?.avatar;
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
