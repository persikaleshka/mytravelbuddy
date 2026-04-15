import { apiClient } from '.';
import type { ChatMessage, CreateChatMessageRequest, ChatSendResponse } from '@/entities/chat/types';

export const getRouteMessages = async (routeId: string): Promise<ChatMessage[]> => {
  const response = await apiClient.get<ChatMessage[]>(`/routes/${routeId}/messages`);
  return response.data;
};

export const sendRouteMessage = async (
  routeId: string,
  data: CreateChatMessageRequest,
): Promise<ChatSendResponse> => {
  const response = await apiClient.post<ChatSendResponse>(`/routes/${routeId}/messages`, data);
  return response.data;
};