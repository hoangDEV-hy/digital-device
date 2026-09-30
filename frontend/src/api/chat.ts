import api from './client';
import type { ApiResponse } from '../types/auth';

export interface ChatUser {
  id: string;
  fullName: string;
  avatar?: string;
  role: 'admin' | 'customer';
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: ChatUser;
}

export interface ChatParticipant {
  id: string;
  userId: string;
  user: ChatUser;
  lastReadAt?: string;
}

export interface ChatConversation {
  id: string;
  participants: ChatParticipant[];
  product?: { id: string; title: string } | null;
  messages?: ChatMessage[];
  lastMessageAt: string;
}

export interface ChatContact {
  user: ChatUser;
  productId: string | null;
}

export async function getChatConversations() {
  const response = await api.get<ApiResponse<ChatConversation[]>>('/chat/conversations');
  return response.data.data ?? [];
}

export async function getChatContacts() {
  const response = await api.get<ApiResponse<ChatContact[]>>('/chat/contacts');
  return response.data.data ?? [];
}

export async function startChat(participantId: string) {
  const response = await api.post<ApiResponse<ChatConversation>>('/chat/conversations', { participantId });
  return response.data.data;
}

export async function getChatMessages(conversationId: string) {
  const response = await api.get<ApiResponse<ChatMessage[]>>(`/chat/conversations/${conversationId}/messages`);
  return response.data.data ?? [];
}

export async function sendChatMessage(conversationId: string, content: string) {
  const response = await api.post<ApiResponse<ChatMessage>>(`/chat/conversations/${conversationId}/messages`, { content });
  return response.data.data;
}

export async function markChatRead(conversationId: string) {
  await api.post(`/chat/conversations/${conversationId}/read`);
}