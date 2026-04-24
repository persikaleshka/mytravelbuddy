import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import type { MapPoint } from '@/shared/api/types/map';
import 'leaflet/dist/leaflet.css';
import './MapDisplay.css';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

function makeIcon(color: string, label: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      color:#fff;
      border-radius:50%;
      width:28px;
      height:28px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:11px;
      font-weight:700;
      border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
    ">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
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

function FlyToPoint({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 15, { animate: true, duration: 0.8 });
  }, [coords, map]);
  return null;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ points, center }) => {
  const { t } = useTranslation();
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (center) {
      const c: [number, number] = [center.latitude, center.longitude];
      setMapCenter(c);
    } else if (points.length > 0) {
      setMapCenter([points[0].latitude, points[0].longitude]);
    }
  }, [center, points]);

  useEffect(() => {
    const handler = (event: CustomEvent) => {
      const { latitude, longitude } = event.detail;
      setFlyTo([latitude, longitude]);
    };
    window.addEventListener('showPointOnMap', handler as EventListener);
    return () => window.removeEventListener('showPointOnMap', handler as EventListener);
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

  if (!initializedRef.current) initializedRef.current = true;

  return (
    <div className="map-display">
      <MapContainer
        center={mapCenter}
        zoom={12}
        style={{ width: '100%', height: '400px' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToPoint coords={flyTo} />

        {polylines.map(({ day, coords, color }) => (
          <Polyline
            key={`line-day-${day}`}
            positions={coords}
            pathOptions={{ color, weight: 3, opacity: 0.8 }}
          />
        ))}

        {points.map((point, index) => {
          const day = (point as { day?: number }).day ?? (point as { day_number?: number }).day_number;
          const color = colorForDay(day);
          const dayGroup = day ? byDay.get(day) ?? [] : [];
          const orderInDay = dayGroup.indexOf(point);
          const label = day ? `${day}-${orderInDay + 1}` : String(index + 1);

          return (
            <Marker
              key={point.location_id || index}
              position={[point.latitude, point.longitude]}
              icon={makeIcon(color, label)}
            >
              <Popup>
                <strong>{point.name}</strong>
                {point.category && <><br />{point.category}</>}
                {day && <><br />День: {day}</>}
                {(point as { reason?: string }).reason && (
                  <><br />{(point as { reason?: string }).reason}</>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

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
