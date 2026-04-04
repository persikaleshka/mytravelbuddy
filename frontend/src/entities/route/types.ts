export interface TravelRoute {
  id: string;
  name: string;
  description: string;
  locations: string[]; 
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRouteDto {
  name: string;
  description: string;
  locations: string[]; 
}

export interface UpdateRouteDto {
  name?: string;
  description?: string;
  locations?: string[]; 
}