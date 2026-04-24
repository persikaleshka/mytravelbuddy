export interface WeatherData {
  date: string;
  temp_max: number | null;
  temp_min: number | null;
  weather_code: number | null;
  precipitation_sum: number | null;
}

export interface WeatherResponse {
  status: string;
  source: string;
  message: string | null;
  data: WeatherData[];
  coords?: {
    latitude: number;
    longitude: number;
  };
}

export interface WeatherPoint {
  date: string;
  temp_max: number | null;
  temp_min: number | null;
  weather_code: number | null;
  precipitation_sum: number | null;
}