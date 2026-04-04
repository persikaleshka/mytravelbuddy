import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLocations,
  createLocation,
} from '../locations';
import type { Location, CreateLocationRequest } from '../types/locations';


const LOCATIONS_QUERY_KEY = 'locations';


export const useLocations = (params?: {
  city?: string;
  category?: string;
}) => {
  return useQuery<Location[], Error>({
    queryKey: [LOCATIONS_QUERY_KEY, params],
    queryFn: () => getLocations(params),
  });
};


export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Location, Error, CreateLocationRequest>({
    mutationFn: (data: CreateLocationRequest) => createLocation(data),
    onSuccess: () => {
      
      queryClient.invalidateQueries({ queryKey: [LOCATIONS_QUERY_KEY] });
    },
  });
};