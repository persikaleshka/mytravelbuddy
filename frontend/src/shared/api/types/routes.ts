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

export interface RouteItem {
  location_id: number;
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