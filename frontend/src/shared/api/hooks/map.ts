import { useQuery } from '@tanstack/react-query';
import { getRouteMapData } from '../map';
import type { MapResponse } from '../types/map';

const MAP_QUERY_KEY = 'map';

export const useRouteMapData = (routeId: string) => {
  return useQuery<MapResponse, Error>({
    queryKey: [MAP_QUERY_KEY, routeId],
    queryFn: () => getRouteMapData(routeId),
    enabled: !!routeId,
  });
};