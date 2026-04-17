import React from 'react';
import type { WeatherPoint } from '@/shared/api/types/weather';
import './WeatherDisplay.css';

interface WeatherDisplayProps {
  weatherData: WeatherPoint[];
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ weatherData }) => {
  const getWeatherIcon = (code: number | null) => {
    if (code === null) return '❓';
    
    // Простая реализация кодов погоды Open-Meteo
    if (code === 0) return '☀️'; // Clear sky
    if (code <= 3) return '⛅'; // Partly cloudy
    if (code <= 48) return '☁️'; // Cloudy
    if (code <= 67) return '🌧️'; // Rain
    if (code <= 77) return '❄️'; // Snow
    if (code <= 99) return '⛈️'; // Thunderstorm
    return '❓';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTemperature = (temp: number | null) => {
    if (temp === null) return '--';
    return `${Math.round(temp)}°C`;
  };

  if (!weatherData || weatherData.length === 0) {
    return (
      <div className="weather-display">
        <h3>Weather Forecast</h3>
        <p>No weather data available</p>
      </div>
    );
  }

  return (
    <div className="weather-display">
      <h3>Weather Forecast</h3>
      <div className="weather-grid">
        {weatherData.map((day, index) => (
          <div key={index} className="weather-day">
            <p className="weather-date">{formatDate(day.date)}</p>
            <div className="weather-icon">{getWeatherIcon(day.weather_code)}</div>
            <div className="weather-temps">
              <span className="temp-max">{formatTemperature(day.temp_max)}</span>
              <span className="temp-min">{formatTemperature(day.temp_min)}</span>
            </div>
            {day.precipitation_sum !== null && day.precipitation_sum > 0 && (
              <p className="precipitation">💧 {day.precipitation_sum}mm</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherDisplay;