import { apiClient } from '.';
import type { TravelRoute, CreateRouteRequest, UpdateRouteRequest, RoutePageResponse } from './types/routes';

export const createRoute = async (
  data: CreateRouteRequest,
): Promise<TravelRoute> => {
  const response = await apiClient.post<TravelRoute>('/routes', data);
  return response.data;
};

export const getUserRoutes = async (): Promise<TravelRoute[]> => {
  const response = await apiClient.get<TravelRoute[]>('/routes');
  return response.data;
};

export const getRoute = async (id: string): Promise<TravelRoute> => {
  const response = await apiClient.get<TravelRoute>(`/routes/${id}`);
  return response.data;
};

export const getRoutePage = async (id: string): Promise<RoutePageResponse> => {
  const response = await apiClient.get<RoutePageResponse>(`/routes/${id}/page`);
  return response.data;
};

export const updateRoute = async (
  id: string,
  data: UpdateRouteRequest,
): Promise<TravelRoute> => {
  const response = await apiClient.put<TravelRoute>(`/routes/${id}`, data);
  return response.data;
};

export const deleteRoute = async (id: string): Promise<void> => {
  await apiClient.delete(`/routes/${id}`);
};