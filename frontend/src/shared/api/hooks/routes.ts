import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createRoute,
  getUserRoutes,
  getRoute,
  updateRoute,
  deleteRoute,
} from '../routes';
import type { CreateRouteRequest, UpdateRouteRequest, TravelRoute } from '../types/routes';


const ROUTES_QUERY_KEY = 'routes';


export const useUserRoutes = () => {
  return useQuery<TravelRoute[], Error>({
    queryKey: [ROUTES_QUERY_KEY],
    queryFn: () => getUserRoutes(),
  });
};


export const useRoute = (id: string) => {
  return useQuery<TravelRoute, Error>({
    queryKey: [ROUTES_QUERY_KEY, id],
    queryFn: () => getRoute(id),
  });
};


export const useCreateRoute = () => {
  const queryClient = useQueryClient();
  
  return useMutation<TravelRoute, Error, CreateRouteRequest>({
    mutationFn: (data: CreateRouteRequest) => createRoute(data),
    onSuccess: () => {
      
      queryClient.invalidateQueries({ queryKey: [ROUTES_QUERY_KEY] });
    },
  });
};


export const useUpdateRoute = () => {
  const queryClient = useQueryClient();
  
  return useMutation<TravelRoute, Error, { id: string; data: UpdateRouteRequest }>({
    mutationFn: ({ id, data }) => updateRoute(id, data),
    onSuccess: (updatedRoute: TravelRoute) => {
      
      queryClient.setQueryData([ROUTES_QUERY_KEY, updatedRoute.id], updatedRoute);
      
      queryClient.invalidateQueries({ queryKey: [ROUTES_QUERY_KEY] });
    },
  });
};


export const useDeleteRoute = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteRoute(id),
    onSuccess: () => {
      
      queryClient.invalidateQueries({ queryKey: [ROUTES_QUERY_KEY] });
    },
  });
};