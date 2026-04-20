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
    onSuccess: (data) => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: [CHAT_QUERY_KEY, routeId] });
      
      // Also update map data with new points
      queryClient.setQueryData(['map', routeId], (oldData: unknown) => {
        if (oldData && typeof oldData === 'object' && data.map_points) {
          const oldDataObj = oldData as Record<string, unknown>;
          return {
            ...oldDataObj,
            points: [...(Array.isArray(oldDataObj.points) ? oldDataObj.points : []), ...data.map_points],
            chat_suggestions: data.map_points
          };
        }
        return oldData;
      });
    },
  });
};