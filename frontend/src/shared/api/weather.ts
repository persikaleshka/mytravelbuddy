import { apiClient } from '.';
import type { WeatherResponse } from './types/weather';

export const getRouteWeather = async (routeId: string): Promise<WeatherResponse> => {
  const response = await apiClient.get<WeatherResponse>(`/routes/${routeId}/weather`);
  return response.data;
};