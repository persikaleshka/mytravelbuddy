import React, { useState, useEffect, useRef } from 'react';
import { YMaps, Map as YMap, Placemark, Polyline } from '@pbe/react-yandex-maps';
import { useTranslation } from 'react-i18next';
import type { MapPoint } from '@/shared/api/types/map';
import './MapDisplay.css';

interface MapDisplayProps {
  points: MapPoint[];
  center: { latitude: number; longitude: number } | null;
  city: string;
}

const DAY_COLORS = [
  '#e05c5c',
  '#4a90d9',
  '#5cb85c',
  '#f0a500',
  '#9b59b6',
  '#17a2b8',
  '#e67e22',
  '#2ecc71',
];

function colorForDay(day: number | undefined): string {
  if (!day || day < 1) return '#667b68';
  return DAY_COLORS[(day - 1) % DAY_COLORS.length];
}

function groupByDay(points: MapPoint[]): globalThis.Map<number, MapPoint[]> {
  const groups = new globalThis.Map<number, MapPoint[]>();
  for (const point of points) {
    const day = (point as { day?: number }).day ?? (point as { day_number?: number }).day_number ?? 0;
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(point);
  }
  return groups;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ points, center }) => {
  const { t } = useTranslation();
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (center) {
      setMapCenter([center.latitude, center.longitude]);
    } else if (points.length > 0) {
      setMapCenter([points[0].latitude, points[0].longitude]);
    }
  }, [center, points]);

  useEffect(() => {
    const handleShowPointOnMap = (event: CustomEvent) => {
      const { latitude, longitude } = event.detail;
      if (mapRef.current) {
        mapRef.current.setCenter([latitude, longitude], 14);
      }
    };

    window.addEventListener('showPointOnMap', handleShowPointOnMap as EventListener);
    return () => {
      window.removeEventListener('showPointOnMap', handleShowPointOnMap as EventListener);
    };
  }, []);

  const byDay = groupByDay(points);

  const polylines: Array<{ day: number; coords: [number, number][]; color: string }> = [];
  byDay.forEach((dayPoints, day) => {
    if (dayPoints.length >= 2) {
      polylines.push({
        day,
        coords: dayPoints.map(p => [p.latitude, p.longitude]),
        color: colorForDay(day),
      });
    }
  });

  if (!points || points.length === 0 || !mapCenter) {
    return (
      <div className="map-display">
        <div className="map-placeholder">
          <p>{t('map.placeholder')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-display">
      <YMaps query={{ apikey: import.meta.env.VITE_YANDEX_MAPS_API_KEY, lang: 'ru_RU' }}>
        <YMap
          instanceRef={mapRef}
          state={{ center: mapCenter, zoom: 11 }}
          width="100%"
          height="400px"
          modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
        >
          {polylines.map(({ day, coords, color }) => (
            <Polyline
              key={`line-day-${day}`}
              geometry={coords}
              options={{
                strokeColor: color,
                strokeWidth: 3,
                strokeOpacity: 0.8,
                strokeStyle: 'solid',
              }}
            />
          ))}

          {points.map((point, index) => {
            const day = (point as { day?: number }).day ?? (point as { day_number?: number }).day_number;
            const color = colorForDay(day);
            const dayGroup = day ? byDay.get(day) ?? [] : [];
            const orderInDay = dayGroup.indexOf(point);
            const label = day ? `${day}-${orderInDay + 1}` : String(index + 1);

            return (
              <Placemark
                key={point.location_id || index}
                geometry={[point.latitude, point.longitude]}
                properties={{
                  iconContent: label,
                  hintContent: point.name,
                  balloonContent: `
                    <strong>${point.name}</strong><br/>
                    ${point.category ? `Категория: ${point.category}<br/>` : ''}
                    ${day ? `День: ${day}<br/>` : ''}
                    ${(point as { reason?: string }).reason ? `${(point as { reason?: string }).reason}<br/>` : ''}
                  `.trim(),
                }}
                options={{
                  preset: 'islands#dotIcon',
                  iconColor: color,
                }}
              />
            );
          })}
        </YMap>
      </YMaps>

      {byDay.size > 1 && (
        <div className="map-legend">
          {Array.from(byDay.entries())
            .filter(([day]) => day > 0)
            .sort(([a], [b]) => a - b)
            .map(([day, dayPoints]) => (
              <span key={day} className="map-legend-item">
                <span
                  className="map-legend-dot"
                  style={{ backgroundColor: colorForDay(day) }}
                />
                {t('map.legendDay', { day, count: dayPoints.length })}
              </span>
            ))}
        </div>
      )}
    </div>
  );
};

export default MapDisplay;
