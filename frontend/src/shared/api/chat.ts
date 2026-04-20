import { apiClient } from '.';
import type { 
  ChatMessage, 
  CreateChatMessageRequest, 
  ChatMapPoint,
  AssistantStructured
} from '@/entities/chat/types';

export interface UpdatedChatSendResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  map_points: ChatMapPoint[];
  assistant_structured: AssistantStructured;
}

export const getRouteMessages = async (routeId: string): Promise<ChatMessage[]> => {
  const response = await apiClient.get<ChatMessage[]>(`/routes/${routeId}/messages`);
  return response.data;
};

export const sendRouteMessage = async (
  routeId: string,
  data: CreateChatMessageRequest,
): Promise<UpdatedChatSendResponse> => {
  const response = await apiClient.post<UpdatedChatSendResponse>(`/routes/${routeId}/messages`, data);
  return response.data;
};