import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRouteMessages, sendRouteMessage, type UpdatedChatSendResponse } from '../chat';
import type { ChatMessage, CreateChatMessageRequest } from '@/entities/chat/types';

const CHAT_QUERY_KEY = 'chat';

export const useRouteMessages = (routeId: string) => {
  return useQuery<ChatMessage[], Error>({
    queryKey: [CHAT_QUERY_KEY, routeId],
    queryFn: () => getRouteMessages(routeId),
  });
};

export const useSendRouteMessage = (routeId: string) => {
  const queryClient = useQueryClient();

  return useMutation<UpdatedChatSendResponse, Error, CreateChatMessageRequest>({
    mutationFn: (data: CreateChatMessageRequest) => sendRouteMessage(routeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHAT_QUERY_KEY, routeId] });
      queryClient.invalidateQueries({ queryKey: ['routes', 'map', routeId] });
    },
  });
};
