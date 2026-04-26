import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WeatherDisplay from '@/widgets/weather-display';
import type { WeatherData } from '@/shared/api/types/weather';

const mockDay = (overrides: Partial<WeatherData> = {}): WeatherData => ({
  date: '2024-07-01',
  temp_max: 25,
  temp_min: 15,
  weather_code: 0,
  precipitation_sum: 0,
  ...overrides,
});

describe('WeatherDisplay', () => {
  it('renders title', () => {
    render(<WeatherDisplay weatherData={[mockDay()]} />);
    expect(screen.getByText('Прогноз погоды')).toBeInTheDocument();
  });

  it('shows no-data message when array is empty', () => {
    render(<WeatherDisplay weatherData={[]} />);
    expect(screen.getByText('Нет данных о погоде')).toBeInTheDocument();
  });

  it('renders temperature for each day', () => {
    render(<WeatherDisplay weatherData={[mockDay({ temp_max: 30, temp_min: 18 })]} />);
    expect(screen.getByText('30°C')).toBeInTheDocument();
    expect(screen.getByText('18°C')).toBeInTheDocument();
  });

  it('renders -- when temperature is null', () => {
    render(<WeatherDisplay weatherData={[mockDay({ temp_max: null, temp_min: null })]} />);
    expect(screen.getAllByText('--')).toHaveLength(2);
  });

  it('renders precipitation when greater than 0', () => {
    render(<WeatherDisplay weatherData={[mockDay({ precipitation_sum: 5.2 })]} />);
    expect(screen.getByText('💧 5.2mm')).toBeInTheDocument();
  });

  it('does not render precipitation when 0', () => {
    render(<WeatherDisplay weatherData={[mockDay({ precipitation_sum: 0 })]} />);
    expect(screen.queryByText(/mm/)).not.toBeInTheDocument();
  });

  it('renders sunny icon for code 0', () => {
    render(<WeatherDisplay weatherData={[mockDay({ weather_code: 0 })]} />);
    expect(screen.getByText('☀️')).toBeInTheDocument();
  });

  it('renders cloudy icon for code 3', () => {
    render(<WeatherDisplay weatherData={[mockDay({ weather_code: 3 })]} />);
    expect(screen.getByText('⛅')).toBeInTheDocument();
  });

  it('renders rain icon for code 60', () => {
    render(<WeatherDisplay weatherData={[mockDay({ weather_code: 60 })]} />);
    expect(screen.getByText('🌧️')).toBeInTheDocument();
  });

  it('renders snow icon for code 71', () => {
    render(<WeatherDisplay weatherData={[mockDay({ weather_code: 71 })]} />);
    expect(screen.getByText('❄️')).toBeInTheDocument();
  });

  it('renders storm icon for code 95', () => {
    render(<WeatherDisplay weatherData={[mockDay({ weather_code: 95 })]} />);
    expect(screen.getByText('⛈️')).toBeInTheDocument();
  });

  it('renders unknown icon for null code', () => {
    render(<WeatherDisplay weatherData={[mockDay({ weather_code: null })]} />);
    expect(screen.getByText('❓')).toBeInTheDocument();
  });

  it('renders multiple days', () => {
    render(
      <WeatherDisplay
        weatherData={[
          mockDay({ date: '2024-07-01', temp_max: 25 }),
          mockDay({ date: '2024-07-02', temp_max: 28 }),
          mockDay({ date: '2024-07-03', temp_max: 22 }),
        ]}
      />,
    );
    expect(screen.getByText('25°C')).toBeInTheDocument();
    expect(screen.getByText('28°C')).toBeInTheDocument();
    expect(screen.getByText('22°C')).toBeInTheDocument();
  });
});
