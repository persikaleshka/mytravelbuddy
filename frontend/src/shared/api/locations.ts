import { apiClient } from '.';
import type { Location, CreateLocationRequest } from './types/locations';


export const getLocations = async (params?: {
  city?: string;
  category?: string;
}): Promise<Location[]> => {
  const response = await apiClient.get<Location[]>('/locations', { params });
  return response.data;
};


export const createLocation = async (
  data: CreateLocationRequest,
): Promise<Location> => {
  const response = await apiClient.post<Location>('/locations', data);
  return response.data;
};