import { useQuery } from '@tanstack/react-query';
import { getRouteWeather } from '../weather';
import type { WeatherResponse } from '../types/weather';

const WEATHER_QUERY_KEY = 'weather';

export const useRouteWeather = (routeId: string) => {
  return useQuery<WeatherResponse, Error>({
    queryKey: [WEATHER_QUERY_KEY, routeId],
    queryFn: () => getRouteWeather(routeId),
    enabled: !!routeId,
  });
};