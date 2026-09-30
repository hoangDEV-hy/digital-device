import { FormEvent, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  ChatContact,
  ChatConversation,
  ChatMessage,
  getChatContacts,
  getChatConversations,
  getChatMessages,
  markChatRead,
  sendChatMessage,
  startChat,
} from '../api/chat';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

export function ChatPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contactId, setContactId] = useState('');
  const [draft, setDraft] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void getChatConversations().then(setConversations).catch(() => toast.error('Không tải được hội thoại'));
    void getChatContacts().then(setContacts).catch(() => toast.error('Không tải được danh sách liên hệ'));
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    const socket = io(SOCKET_URL, { auth: { token: accessToken } });
    socketRef.current = socket;
    socket.on('connect', () => {
      setConnected(true);
      if (activeIdRef.current) socket.emit('chat:join', activeIdRef.current);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('chat:message', (message: ChatMessage) => {
      if (activeIdRef.current === message.conversationId) {
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      }
      setConversations((current) => current.map((conversation) => conversation.id === message.conversationId
        ? { ...conversation, lastMessageAt: message.createdAt, messages: [message] }
        : conversation));
    });
    socket.on('connect_error', () => setConnected(false));
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = async (conversation: ChatConversation) => {
    if (activeIdRef.current && activeIdRef.current !== conversation.id) {
      socketRef.current?.emit('chat:leave', activeIdRef.current);
    }
    activeIdRef.current = conversation.id;
    setActiveConversation(conversation);
    setLoadingMessages(true);
    if (socketRef.current?.connected) socketRef.current.emit('chat:join', conversation.id);
    try {
      const history = await getChatMessages(conversation.id);
      setMessages(history);
      await markChatRead(conversation.id);
    } catch {
      toast.error('Không tải được tin nhắn');
    } finally {
      setLoadingMessages(false);
    }
  };

  const createConversation = async () => {
    if (!contactId) return;
    try {
      const conversation = await startChat(contactId);
      setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]);
      await openConversation(conversation);
    } catch {
      toast.error('Không thể mở cuộc hội thoại');
    }
  };

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !activeConversation || sending) return;
    setSending(true);
    try {
      const message = await sendChatMessage(activeConversation.id, content);
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      setDraft('');
      setConversations((current) => current.map((conversation) => conversation.id === message.conversationId
        ? { ...conversation, lastMessageAt: message.createdAt, messages: [message] }
        : conversation));
    } catch {
      toast.error('Không gửi được tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const titleFor = (conversation: ChatConversation) => conversation.participants
    .map((participant) => participant.user)
    .find((user) => user?.id !== currentUserId)?.fullName || 'Hội thoại';

  return (
    <section className="space-y-5">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Hỗ trợ</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">Tin nhắn</h1>
        </div>
        <span className={`text-xs font-medium ${connected ? 'text-emerald-700' : 'text-slate-400'}`}>
          {connected ? 'Đang kết nối' : 'Đang kết nối lại'}
        </span>
      </header>

      <div className="grid min-h-[620px] overflow-hidden border border-slate-200 bg-white lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="chat-contact">Tạo hội thoại</label>
            <div className="flex gap-2">
              <select id="chat-contact" className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-2 py-2 text-sm" value={contactId} onChange={(event) => setContactId(event.target.value)}>
                <option value="">Chọn người dùng</option>
                {contacts.map(({ user }) => <option key={user.id} value={user.id}>{user.fullName} · {user.role === 'admin' ? 'Admin' : 'Customer'}</option>)}
              </select>
              <button type="button" onClick={() => void createConversation()} disabled={!contactId} className="rounded bg-orange-500 px-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-40">Mở</button>
            </div>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {conversations.length ? conversations.map((conversation) => {
              const lastMessage = conversation.messages?.[0];
              return (
                <button key={conversation.id} type="button" onClick={() => void openConversation(conversation)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${activeConversation?.id === conversation.id ? 'bg-orange-50' : ''}`}>
                  <span className="block truncate text-sm font-semibold text-slate-800">{titleFor(conversation)}</span>
                  <span className="mt-1 block truncate text-xs text-slate-500">{lastMessage?.content || conversation.product?.title || 'Chưa có tin nhắn'}</span>
                </button>
              );
            }) : <p className="px-4 py-8 text-center text-sm text-slate-500">Chưa có hội thoại</p>}
          </div>
        </aside>

        <div className="flex min-h-[540px] flex-col">
          {activeConversation ? (
            <>
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="font-semibold text-slate-800">{titleFor(activeConversation)}</h2>
                <p className="mt-1 text-xs text-slate-500">{activeConversation.product?.title || 'Trao đổi với người dùng'}</p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-5">
                {loadingMessages ? <p className="text-sm text-slate-500">Đang tải tin nhắn...</p> : null}
                {messages.map((message) => {
                  const own = message.senderId === currentUserId;
                  return <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] rounded-lg px-3 py-2 ${own ? 'bg-slate-800 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
                      {!own ? <p className="mb-1 text-[11px] font-semibold text-orange-700">{message.sender.fullName}</p> : null}
                      <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                      <p className={`mt-1 text-right text-[10px] ${own ? 'text-slate-300' : 'text-slate-400'}`}>{new Date(message.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>;
                })}
                <div ref={messageEndRef} />
              </div>
              <form onSubmit={(event) => void submitMessage(event)} className="flex gap-3 border-t border-slate-200 bg-white p-4">
                <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={4000} placeholder="Nhập tin nhắn..." className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500" />
                <button type="submit" disabled={!draft.trim() || sending} className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-40">Gửi</button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500">Chọn một hội thoại hoặc mở cuộc trò chuyện mới.</div>
          )}
        </div>
      </div>
    </section>
  );
}