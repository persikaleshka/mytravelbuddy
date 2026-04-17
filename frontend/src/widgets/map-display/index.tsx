import React from 'react';
import type { MapPoint } from '@/shared/api/types/map';
import './MapDisplay.css';

interface MapDisplayProps {
  points: MapPoint[];
  center: { latitude: number; longitude: number } | null;
  city: string;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ points, center, city }) => {
  // Для простого отображения создадим визуализацию карты с точками
  // В реальной реализации здесь будет компонент карты (например, Leaflet, Google Maps и т.д.)

  const renderMapVisualization = () => {
    // Создаем визуализацию карты с точками
    return (
      <div className="map-visualization">
        <div className="map-background">
          {/* Отображаем точки на карте */}
          {points.map((point, index) => (
            <div
              key={point.location_id}
              className="map-marker"
              style={{
                position: 'absolute',
                left: `${20 + (index * 15) % 60}%`,
                top: `${30 + (index * 10) % 40}%`,
              }}
              title={`${point.name} (${point.category})`}
            >
              <div className="marker-icon">📍</div>
              <div className="marker-label">{point.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!points || points.length === 0) {
    return (
      <div className="map-display">
        <h3>Route Map</h3>
        <p>No route points available</p>
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
      {renderMapVisualization()}
      <div className="points-list">
        <h4>Route Points:</h4>
        {points.map((point, index) => (
          <div key={point.location_id} className="point-item">
            <span className="point-number">{index + 1}.</span>
            <div className="point-details">
              <strong>{point.name}</strong>
              <div className="point-meta">
                <span className="point-category">{point.category}</span>
                <span className="point-coords">
                  {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapDisplay;