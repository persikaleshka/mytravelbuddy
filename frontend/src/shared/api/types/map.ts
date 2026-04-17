export interface RoutePoint {
  location_id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  day_number: number;
  order_in_day: number;
}

export interface MapResponse {
  status: string;
  routeId: string;
  city: string;
  center: {
    latitude: number;
    longitude: number;
  } | null;
  points: RoutePoint[];
}

export interface MapPoint {
  location_id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  day_number: number;
  order_in_day: number;
}