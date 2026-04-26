import React from 'react';
import { useTranslation } from 'react-i18next';
import type { WeatherData } from '@/shared/api/types/weather';
import './WeatherDisplay.css';

interface WeatherDisplayProps {
  weatherData: WeatherData[];
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ weatherData }) => {
  const { t, i18n } = useTranslation();

  const getWeatherIcon = (code: number | null) => {
    if (code === null) return '❓';
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '☁️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 99) return '⛈️';
    return '❓';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTemperature = (temp: number | null) => {
    if (temp === null) return '--';
    return `${Math.round(temp)}°C`;
  };

  if (!weatherData || weatherData.length === 0) {
    return (
      <div className="weather-display">
        <h3>{t('weather.title')}</h3>
        <p>{t('weather.noData')}</p>
      </div>
    );
  }

  return (
    <div className="weather-display">
      <h3>{t('weather.title')}</h3>
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
