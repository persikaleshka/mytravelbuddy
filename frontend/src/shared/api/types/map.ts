export interface RoutePoint {
  location_id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  day_number: number;
  order_in_day: number;
}

export interface ChatSuggestion {
  location_id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  day?: number;
  reason?: string;
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
  chat_suggestions: ChatSuggestion[];
}

export interface MapPoint {
  location_id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  day_number?: number;
  order_in_day?: number;
  day?: number;
  reason?: string;
}

export interface MapPoint {
  location_id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  day_number?: number;
  order_in_day?: number;
  day?: number;
  reason?: string;
}