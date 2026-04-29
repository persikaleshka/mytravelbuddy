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
    onError: (error: unknown) => {
      const isTimeout =
        (error as { code?: string })?.code === 'ECONNABORTED' ||
        (error as { message?: string })?.message?.toLowerCase().includes('timeout');
      if (isTimeout) {
        queryClient.invalidateQueries({ queryKey: [CHAT_QUERY_KEY, routeId] });
      }
    },
    onSuccess: (response) => {
      queryClient.setQueryData<ChatMessage[]>(
        [CHAT_QUERY_KEY, routeId],
        (old) => [...(old ?? []), response.user_message, response.assistant_message],
      );

      const mapKey = [ROUTES_QUERY_KEY, 'map', routeId];
      const latestPoints = (response.map_points ?? []).map(p => ({
        location_id: p.location_id,
        name: p.name,
        category: p.category || 'other',
        latitude: p.latitude,
        longitude: p.longitude,
        day: p.day,
        reason: p.reason,
      }));

      if (latestPoints.length > 0) {
        queryClient.setQueryData<MapResponse>(mapKey, old => {
          const center = old?.center ?? {
            latitude: latestPoints.reduce((s, p) => s + p.latitude, 0) / latestPoints.length,
            longitude: latestPoints.reduce((s, p) => s + p.longitude, 0) / latestPoints.length,
          };
          return {
            status: 'ok',
            routeId,
            city: old?.city ?? '',
            center,
            points: old?.points ?? [],
            chat_suggestions: latestPoints,
          };
        });
      } else {
        queryClient.invalidateQueries({ queryKey: mapKey });
      }
    },
  });
};
