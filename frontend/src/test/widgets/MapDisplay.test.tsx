import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MapDisplay from '@/widgets/map-display';
import type { MapPoint } from '@/shared/api/types/map';

vi.mock('@pbe/react-yandex-maps', () => ({
  YMaps: ({ children }: { children: React.ReactNode }) => children,
  Map: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ymap">{children}</div>
  ),
  Placemark: ({ properties }: { properties: Record<string, string> }) => (
    <div data-testid="placemark">{properties.hintContent}</div>
  ),
  Polyline: () => <div data-testid="polyline" />,
}));

const mockPoint = (overrides: Partial<MapPoint> = {}): MapPoint => ({
  location_id: '1',
  name: 'Третьяковская галерея',
  category: 'museum',
  latitude: 55.7415,
  longitude: 37.6208,
  ...overrides,
});

describe('MapDisplay', () => {
  it('shows placeholder when no points', () => {
    render(<MapDisplay points={[]} center={null} city="" />);
    expect(
      screen.getByText('Спросите ассистента — он предложит места на карте'),
    ).toBeInTheDocument();
  });

  it('renders map when points and center are provided', () => {
    render(
      <MapDisplay
        points={[mockPoint()]}
        center={{ latitude: 55.75, longitude: 37.62 }}
        city="Москва"
      />,
    );
    expect(screen.getByTestId('ymap')).toBeInTheDocument();
  });

  it('renders a placemark for each point', () => {
    render(
      <MapDisplay
        points={[
          mockPoint({ location_id: '1', name: 'Третьяковка' }),
          mockPoint({ location_id: '2', name: 'Красная площадь' }),
        ]}
        center={{ latitude: 55.75, longitude: 37.62 }}
        city="Москва"
      />,
    );
    expect(screen.getAllByTestId('placemark')).toHaveLength(2);
    expect(screen.getByText('Третьяковка')).toBeInTheDocument();
    expect(screen.getByText('Красная площадь')).toBeInTheDocument();
  });

  it('renders polyline when day group has 2+ points', () => {
    render(
      <MapDisplay
        points={[
          mockPoint({ location_id: '1', name: 'Место 1', day_number: 1 }),
          mockPoint({ location_id: '2', name: 'Место 2', day_number: 1 }),
        ]}
        center={{ latitude: 55.75, longitude: 37.62 }}
        city="Москва"
      />,
    );
    expect(screen.getByTestId('polyline')).toBeInTheDocument();
  });

  it('renders legend when multiple days', () => {
    render(
      <MapDisplay
        points={[
          mockPoint({ location_id: '1', day_number: 1 }),
          mockPoint({ location_id: '2', day_number: 2 }),
        ]}
        center={{ latitude: 55.75, longitude: 37.62 }}
        city="Москва"
      />,
    );
    expect(screen.getByText('День 1')).toBeInTheDocument();
    expect(screen.getByText('День 2')).toBeInTheDocument();
  });
});
