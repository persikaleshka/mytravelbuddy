import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRouteMessages, sendRouteMessage } from '../chat';
import type { ChatMessage, CreateChatMessageRequest, ChatSendResponse } from '@/entities/chat/types';

const CHAT_QUERY_KEY = 'chat';

export const useRouteMessages = (routeId: string) => {
  return useQuery<ChatMessage[], Error>({
    queryKey: [CHAT_QUERY_KEY, routeId],
    queryFn: () => getRouteMessages(routeId),
  });
};

export const useSendRouteMessage = (routeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<ChatSendResponse, Error, CreateChatMessageRequest>({
    mutationFn: (data: CreateChatMessageRequest) => sendRouteMessage(routeId, data),
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: [CHAT_QUERY_KEY, routeId] });
    },
  });
};