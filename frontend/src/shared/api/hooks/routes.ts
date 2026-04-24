import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createRoute,
  getUserRoutes,
  getRoute,
  getRoutePage,
  getRouteMapData,
  updateRoute,
  deleteRoute,
} from '../routes';
import type { CreateRouteRequest, UpdateRouteRequest, TravelRoute, RoutePageResponse } from '../types/routes';
import type { MapResponse } from '../types/map';
import { ROUTES_QUERY_KEY } from '../query-keys';


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
    enabled: !!id,
  });
};

export const useRoutePage = (id: string) => {
  return useQuery<RoutePageResponse, Error>({
    queryKey: [ROUTES_QUERY_KEY, 'page', id],
    queryFn: () => getRoutePage(id),
    enabled: !!id,
  });
};

export const useRouteMapData = (id: string) => {
  return useQuery<MapResponse, Error>({
    queryKey: [ROUTES_QUERY_KEY, 'map', id],
    queryFn: () => getRouteMapData(id),
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
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