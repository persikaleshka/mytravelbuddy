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

export interface CreateRouteDto {
  name: string;
  city: string;
  start_date: string;
  end_date: string;
}

export interface UpdateRouteDto {
  name?: string;
  city?: string;
  start_date?: string;
  end_date?: string;
}