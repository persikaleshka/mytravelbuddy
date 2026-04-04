export interface Location {
  id: string;
  name: string;
  description: string;
  city: string;
  category: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
}

export interface CreateLocationRequest {
  name: string;
  description: string;
  city: string;
  category: string;
  latitude: number;
  longitude: number;
}