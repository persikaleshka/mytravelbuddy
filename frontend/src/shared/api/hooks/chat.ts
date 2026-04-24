import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRouteMessages, sendRouteMessage, type UpdatedChatSendResponse } from '../chat';
import type { ChatMessage, CreateChatMessageRequest } from '@/entities/chat/types';
import type { MapResponse } from '../types/map';
import { ROUTES_QUERY_KEY, CHAT_QUERY_KEY } from '../query-keys';

export const useRouteMessages = (routeId: string) => {
  return useQuery<ChatMessage[], Error>({
    queryKey: [CHAT_QUERY_KEY, routeId],
    queryFn: () => getRouteMessages(routeId),
    enabled: !!routeId,
  });
};

export const useSendRouteMessage = (routeId: string) => {
  const queryClient = useQueryClient();

  return useMutation<UpdatedChatSendResponse, Error, CreateChatMessageRequest>({
    mutationFn: (data: CreateChatMessageRequest) => sendRouteMessage(routeId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [CHAT_QUERY_KEY, routeId] });

      if (response.map_points && response.map_points.length > 0) {
        const mapKey = [ROUTES_QUERY_KEY, 'map', routeId];
        const prev = queryClient.getQueryData<MapResponse>(mapKey);
        const existingIds = new Set((prev?.chat_suggestions ?? []).map(p => p.location_id));
        const newPoints = response.map_points.filter(p => !existingIds.has(p.location_id));

        if (newPoints.length > 0) {
          queryClient.setQueryData<MapResponse>(mapKey, old => {
            if (!old) return old;
            return {
              ...old,
              chat_suggestions: [...(old.chat_suggestions ?? []), ...newPoints],
            };
          });
        }
      }
    },
  });
};
