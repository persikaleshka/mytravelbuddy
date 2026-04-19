import { apiClient } from '.';
import type { MapResponse } from './types/map';

export const getRouteMapData = async (routeId: string): Promise<MapResponse> => {
  const response = await apiClient.get<MapResponse>(`/routes/${routeId}/map`);
  return response.data;
};