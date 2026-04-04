export interface TravelRoute {
  id: string;
  name: string;
  description: string;
  locations: string[]; 
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRouteRequest {
  name: string;
  description: string;
  locations: string[]; 
}

export interface UpdateRouteRequest {
  name?: string;
  description?: string;
  locations?: string[]; 
}