import React, { useState, useEffect, useRef } from 'react';
import { YMaps, Map as YMap, Placemark, Polyline } from '@pbe/react-yandex-maps';
import type { MapPoint } from '@/shared/api/types/map';
import './MapDisplay.css';

interface MapDisplayProps {
  points: MapPoint[];
  center: { latitude: number; longitude: number } | null;
  city: string;
}

// Palette for days — cycles if more than 8 days
const DAY_COLORS = [
  '#e05c5c', // day 1 — red
  '#4a90d9', // day 2 — blue
  '#5cb85c', // day 3 — green
  '#f0a500', // day 4 — amber
  '#9b59b6', // day 5 — purple
  '#17a2b8', // day 6 — teal
  '#e67e22', // day 7 — orange
  '#2ecc71', // day 8 — emerald
];

function colorForDay(day: number | undefined): string {
  if (!day || day < 1) return '#667b68';
  return DAY_COLORS[(day - 1) % DAY_COLORS.length];
}

// Groups points by day, preserving order within each day
function groupByDay(points: MapPoint[]): globalThis.Map<number, MapPoint[]> {
  const groups = new globalThis.Map<number, MapPoint[]>();
  for (const point of points) {
    const day = (point as { day?: number }).day ?? (point as { day_number?: number }).day_number ?? 0;
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(point);
  }
  return groups;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ points, center, city }) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.751244, 37.618423]);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void city; // city prop kept for external use / future display

  // Days with more than one point get a polyline
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

  if (!points || points.length === 0) {
    return (
      <div className="map-display">
        <div className="map-placeholder">
          <p>Спросите ассистента — он предложит места на карте</p>
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

          {/* Polylines per day */}
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

          {/* Placemarks */}
          {points.map((point, index) => {
            const day = (point as { day?: number }).day ?? (point as { day_number?: number }).day_number;
            const color = colorForDay(day);
            // Order within the day for the label
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

      {/* Day legend — only shown when there are multiple days */}
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
                День {day} ({dayPoints.length})
              </span>
            ))}
        </div>
      )}
    </div>
  );
};

export default MapDisplay;
