import type { WeatherResponse } from './weather';
import type { RoutePoint } from './map';

export interface TravelRoute {
  id: string;
  name: string;
  city: string;
  start_date: string;
  end_date: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutePageResponse {
  route: TravelRoute;
  preferences: string[];
  route_points: RoutePoint[];
  weather: WeatherResponse;
  tickets: unknown[];
}

export interface RouteItem {
  location_id: string;
  day_number: number;
  order_in_day: number;
}

export interface CreateRouteRequest {
  name: string;
  city: string;
  start_date: string;
  end_date: string;
  items: RouteItem[];
}

export interface UpdateRouteRequest {
  name?: string;
  city?: string;
  start_date?: string;
  end_date?: string;
  items?: RouteItem[];
}