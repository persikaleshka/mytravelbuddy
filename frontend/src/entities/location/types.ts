export interface Location {
  id: string;
  name: string;
  description: string;
  city: string;
  category: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationFilters {
  city?: string;
  category?: string;
}