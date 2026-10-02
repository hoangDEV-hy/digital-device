import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ChatContact, ChatConversation, ChatMessage, api, getAccessToken, SOCKET_URL } from '../api';

const chatColors = {
  ink: '#1D2B25',
  muted: '#718078',
  orange: '#E97E52',
  white: '#FFFDF8',
  line: '#E4E0D7',
  soft: '#F8F5F0',
};

type ChatScreenProps = {
  userId: string;
  initialContact: { participantId: string; productId: string } | null;
  onInitialHandled: () => void;
  onThreadChange: (isOpen: boolean) => void;
};

export function ChatScreen({ userId, initialContact, onInitialHandled, onThreadChange }: ChatScreenProps) {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const initialRequestRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([api.chatContacts(), api.chatConversations()])
      .then(([contactResult, conversationResult]) => {
        if (!active) return;
        setContacts(contactResult.data || []);
        setConversations(conversationResult.data || []);
      })
      .catch((error) => Alert.alert('Không tải được tin nhắn', error instanceof Error ? error.message : 'Vui lòng thử lại.'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    let socket: Socket | null = null;
    void getAccessToken().then((token) => {
      if (!active || !token) return;
      socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
      socketRef.current = socket;
      socket.on('connect', () => {
        setConnected(true);
        if (activeIdRef.current) socket?.emit('chat:join', activeIdRef.current);
      });
      socket.on('disconnect', () => setConnected(false));
      socket.on('connect_error', () => setConnected(false));
      socket.on('chat:message', (message: ChatMessage) => {
        if (activeIdRef.current === message.conversationId) {
          setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
        }
        setConversations((current) => current.map((conversation) => conversation.id === message.conversationId
          ? { ...conversation, lastMessageAt: message.createdAt, messages: [message] }
          : conversation));
      });
    });
    return () => {
      active = false;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const openConversation = async (conversation: ChatConversation) => {
    if (activeIdRef.current && activeIdRef.current !== conversation.id) {
      socketRef.current?.emit('chat:leave', activeIdRef.current);
    }
    activeIdRef.current = conversation.id;
    setActiveConversation(conversation);
    onThreadChange(true);
    setLoadingMessages(true);
    if (socketRef.current?.connected) socketRef.current.emit('chat:join', conversation.id);
    try {
      const result = await api.chatMessages(conversation.id);
      setMessages((current) => {
        const history = result.data || [];
        const historyIds = new Set(history.map((message) => message.id));
        return [...history, ...current.filter((message) => !historyIds.has(message.id))];
      });
      await api.markChatRead(conversation.id);
    } catch (error) {
      Alert.alert('Không tải được hội thoại', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    } finally {
      setLoadingMessages(false);
    }
  };

  const startConversation = async (contact: ChatContact) => {
    try {
      const result = await api.startChat(contact.user.id, contact.productId);
      setConversations((current) => [result.data, ...current.filter((item) => item.id !== result.data.id)]);
      await openConversation(result.data);
    } catch (error) {
      Alert.alert('Không thể mở hội thoại', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    }
  };

  useEffect(() => {
    if (!initialContact) {
      initialRequestRef.current = null;
      return;
    }
    const requestKey = `${initialContact.participantId}:${initialContact.productId}`;
    if (initialRequestRef.current === requestKey) return;
    initialRequestRef.current = requestKey;
    const contact = contacts.find((item) => item.user.id === initialContact.participantId) || {
      user: { id: initialContact.participantId, fullName: 'Người bán', role: 'customer' },
      productId: initialContact.productId,
    };
    void startConversation(contact).finally(onInitialHandled);
  }, [initialContact?.participantId, initialContact?.productId, contacts]);

  const submitMessage = async () => {
    const content = draft.trim();
    if (!content || !activeConversation || sending) return;
    setSending(true);
    try {
      const result = await api.sendChatMessage(activeConversation.id, content);
      setMessages((current) => current.some((item) => item.id === result.data.id) ? current : [...current, result.data]);
      setConversations((current) => current.map((conversation) => conversation.id === result.data.conversationId
        ? { ...conversation, lastMessageAt: result.data.createdAt, messages: [result.data] }
        : conversation));
      setDraft('');
    } catch (error) {
      Alert.alert('Không gửi được tin nhắn', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const conversationTitle = (conversation: ChatConversation) => conversation.participants
    .map((participant) => participant.user)
    .find((participant) => participant.id !== userId)?.fullName || 'Hội thoại';
  const supportContact = contacts.find((contact) => contact.user.role === 'admin');
  const marketplaceContacts = contacts.filter((contact) => contact.user.role !== 'admin');
  const visibleConversations = conversations.filter((conversation) =>
    !conversation.participants.some((participant) => participant.user.id !== userId && participant.user.role === 'admin'),
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={chatColors.orange} /></View>;

  if (activeConversation) {
    const title = conversationTitle(activeConversation);
    return (
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => { socketRef.current?.emit('chat:leave', activeConversation.id); activeIdRef.current = null; setActiveConversation(null); setMessages([]); onThreadChange(false); }} accessibilityRole="button" accessibilityLabel="Quay lại danh sách hội thoại">
            <Text style={styles.backText}>‹  Hội thoại</Text>
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <Text style={styles.status}>{connected ? 'Đang hoạt động' : 'Đang kết nối lại'}</Text>
          </View>
        </View>
        <FlatList
          ref={listRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          data={messages}
          keyExtractor={(message) => message.id}
          ListEmptyComponent={<Text style={styles.emptyMessages}>{loadingMessages ? 'Đang tải tin nhắn...' : 'Bắt đầu cuộc trò chuyện.'}</Text>}
          renderItem={({ item }) => {
            const own = item.senderId === userId;
            return (
              <View style={[styles.messageRow, own ? styles.ownRow : styles.otherRow]}>
                <View style={[styles.bubble, own ? styles.ownBubble : styles.otherBubble]}>
                  {!own ? <Text style={styles.sender}>{item.sender.fullName}</Text> : null}
                  <Text style={[styles.messageText, own && styles.ownMessageText]}>{item.content}</Text>
                  <Text style={[styles.messageTime, own && styles.ownMessageDate]}>{new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
            );
          }}
        />
        <View style={styles.composer}>
          <TextInput value={draft} onChangeText={setDraft} style={styles.input} placeholder="Nhập tin nhắn..." placeholderTextColor={chatColors.muted} multiline maxLength={4000} />
          <Pressable onPress={() => void submitMessage()} disabled={!draft.trim() || sending} style={[styles.sendButton, (!draft.trim() || sending) && styles.disabledButton]} accessibilityRole="button" accessibilityLabel="Gửi tin nhắn">
            <Text style={styles.sendText}>{sending ? '...' : 'Gửi'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>HỘP THƯ</Text>
          <Text style={styles.title}>Tin nhắn</Text>
        </View>
        <Text style={[styles.connectionDot, connected ? styles.online : styles.offline]}>{connected ? '●' : '○'}</Text>
      </View>
      {supportContact ? (
        <Pressable onPress={() => void startConversation(supportContact)} style={styles.supportAction} accessibilityRole="button">
          <View style={styles.supportIcon}><Ionicons name="headset-outline" size={20} color={chatColors.orange} /></View>
          <View style={styles.supportInfo}>
            <Text style={styles.supportTitle}>Nhắn với Admin</Text>
            <Text style={styles.supportSubtitle}>Nhắn bất cứ lúc nào, Admin sẽ phản hồi sau</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={chatColors.muted} />
        </Pressable>
      ) : null}
      <FlatList
        style={styles.conversationList}
        contentContainerStyle={styles.listContent}
        data={visibleConversations}
        keyExtractor={(conversation) => conversation.id}
        ListEmptyComponent={conversations.length > 0 && visibleConversations.length === 0 ? null : <Text style={styles.emptyMessages}>Chưa có hội thoại. Chọn người bán hoặc người mua bên dưới để bắt đầu.</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => void openConversation(item)} style={styles.conversationRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{conversationTitle(item).slice(0, 1).toUpperCase()}</Text></View>
            <View style={styles.conversationInfo}>
              <View style={styles.conversationHeading}>
                <Text style={styles.contactName} numberOfLines={1}>{conversationTitle(item)}</Text>
                <Text style={styles.messageDate}>{new Date(item.lastMessageAt).toLocaleDateString('vi-VN')}</Text>
              </View>
              <Text style={styles.preview} numberOfLines={1}>{item.messages?.[0]?.content || item.product?.title || 'Chưa có tin nhắn'}</Text>
            </View>
          </Pressable>
        )}
        ListFooterComponent={marketplaceContacts.length ? (
          <View style={styles.contactsSection}>
            <Text style={styles.sectionTitle}>Bắt đầu trò chuyện</Text>
            {marketplaceContacts.map((contact) => (
              <Pressable key={`${contact.user.id}-${contact.productId || 'contact'}`} onPress={() => void startConversation(contact)} style={styles.contactRow}>
                <View style={styles.contactAvatar}><Text style={styles.avatarText}>{contact.user.fullName.slice(0, 1).toUpperCase()}</Text></View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.user.fullName}</Text>
                  <Text style={styles.contactRole}>{contact.productId ? 'Người bán / người mua' : 'Liên hệ'}</Text>
                </View>
                <Text style={styles.openArrow}>›</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: chatColors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: chatColors.white },
  header: { minHeight: 70, paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: chatColors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitleWrap: { flex: 1, alignItems: 'center', marginHorizontal: 12 },
  eyebrow: { color: chatColors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: chatColors.ink, fontSize: 18, fontWeight: '800', marginTop: 2, maxWidth: '100%' },
  backText: { color: chatColors.orange, fontWeight: '700', fontSize: 14 },
  status: { color: chatColors.muted, fontSize: 11, marginTop: 2 },
  connectionDot: { fontSize: 18 },
  online: { color: '#37966D' },
  offline: { color: chatColors.muted },
  conversationList: { flex: 1 },
  listContent: { paddingBottom: 110 },
  conversationRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: chatColors.line, gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7E1D6' },
  avatarText: { color: chatColors.ink, fontSize: 15, fontWeight: '800' },
  conversationInfo: { flex: 1, minWidth: 0 },
  conversationHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  contactName: { flex: 1, color: chatColors.ink, fontSize: 14, fontWeight: '700' },
  preview: { color: chatColors.muted, fontSize: 12, marginTop: 5 },
  messageDate: { color: chatColors.muted, fontSize: 10 },
  contactsSection: { paddingTop: 18 },
  sectionTitle: { color: chatColors.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', paddingHorizontal: 18, paddingBottom: 6 },
  supportAction: { minHeight: 68, marginHorizontal: 16, marginTop: 12, marginBottom: 4, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#EFC4AE', borderRadius: 10, backgroundColor: '#FFF6F0' },
  supportIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#FBE5D9' },
  supportInfo: { flex: 1, minWidth: 0 },
  supportTitle: { color: chatColors.ink, fontSize: 14, fontWeight: '800' },
  supportSubtitle: { color: chatColors.muted, fontSize: 11, marginTop: 3 },
  contactRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8, gap: 11 },
  contactAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5EFE7', alignItems: 'center', justifyContent: 'center' },
  contactInfo: { flex: 1 },
  contactRole: { color: chatColors.muted, fontSize: 11, marginTop: 2 },
  openArrow: { color: chatColors.orange, fontSize: 24, paddingHorizontal: 5 },
  emptyMessages: { color: chatColors.muted, fontSize: 13, textAlign: 'center', padding: 24, lineHeight: 20 },
  messageList: { flex: 1, backgroundColor: chatColors.soft },
  messageContent: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 14, paddingVertical: 16 },
  messageRow: { width: '100%', marginBottom: 10 },
  ownRow: { alignItems: 'flex-end' },
  otherRow: { alignItems: 'flex-start' },
  bubble: { maxWidth: '84%', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14 },
  ownBubble: { backgroundColor: chatColors.ink, borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: chatColors.white, borderWidth: 1, borderColor: chatColors.line, borderBottomLeftRadius: 4 },
  sender: { color: chatColors.orange, fontSize: 10, fontWeight: '800', marginBottom: 3 },
  messageText: { color: chatColors.ink, fontSize: 14, lineHeight: 20 },
  ownMessageText: { color: chatColors.white },
  messageTime: { color: chatColors.muted, fontSize: 9, marginTop: 4, textAlign: 'right' },
  ownMessageDate: { color: '#C7D0CB' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 9, borderTopWidth: 1, borderTopColor: chatColors.line, backgroundColor: chatColors.white },
  input: { flex: 1, maxHeight: 110, minHeight: 42, borderWidth: 1, borderColor: chatColors.line, borderRadius: 12, backgroundColor: chatColors.soft, paddingHorizontal: 12, paddingVertical: 9, color: chatColors.ink, fontSize: 14 },
  sendButton: { height: 42, minWidth: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: chatColors.orange, paddingHorizontal: 12 },
  disabledButton: { opacity: 0.45 },
  sendText: { color: chatColors.white, fontWeight: '800', fontSize: 13 },
});