import React, { useState, useEffect, useRef } from 'react';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
import type { MapPoint } from '@/shared/api/types/map';
import './MapDisplay.css';

interface MapDisplayProps {
  points: MapPoint[];
  center: { latitude: number; longitude: number } | null;
  city: string;
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
        mapRef.current.setCenter([latitude, longitude], 13);
      }
    };

    window.addEventListener('showPointOnMap', handleShowPointOnMap as EventListener);
    return () => {
      window.removeEventListener('showPointOnMap', handleShowPointOnMap as EventListener);
    };
  }, []);

  if (!points || points.length === 0) {
    return (
      <div className="map-display">
        <h3>Route Map</h3>
        <div className="map-placeholder">
          <p>ИИ не предложил точки, попробуйте уточнить запрос</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-display">
      <h3>Route Map</h3>
      <div className="map-info">
        <p><strong>City:</strong> {city}</p>
        {center && (
          <p><strong>Center:</strong> {center.latitude.toFixed(4)}, {center.longitude.toFixed(4)}</p>
        )}
      </div>
      
      <YMaps query={{ apikey: import.meta.env.VITE_YANDEX_MAPS_API_KEY }}>
        <Map
          instanceRef={mapRef}
          state={{ center: mapCenter, zoom: 10 }}
          width="100%"
          height="400px"
          modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
        >
          {points.map((point, index) => (
            <Placemark
              key={point.location_id || index}
              geometry={[point.latitude, point.longitude]}
              properties={{
                iconContent: point.name,
                hintContent: `${point.name} (${point.category})`,
                balloonContent: `
                  <strong>${point.name}</strong><br/>
                  Категория: ${point.category}<br/>
                  ${point.reason ? `Причина: ${point.reason}<br/>` : ''}
                  ${point.day ? `День: ${point.day}<br/>` : ''}
                `
              }}
              options={{
                preset: 'islands#blueIcon',
                iconColor: '#007bff'
              }}
            />
          ))}
        </Map>
      </YMaps>
    </div>
  );
};

export default MapDisplay;