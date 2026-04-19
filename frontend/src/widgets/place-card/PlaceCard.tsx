import React from 'react';
import './index.css';

interface PlaceCardProps {
  name: string;
  day?: number;
  reason?: string;
  onShowOnMap: () => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ name, day, reason, onShowOnMap }) => {
  return (
    <div className="place-card">
      <h3 className="place-name">{name}</h3>
      {day && <p className="place-day">День: {day}</p>}
      {reason && <p className="place-reason">Причина: {reason}</p>}
      <button className="show-on-map-button" onClick={onShowOnMap}>
        Показать на карте
      </button>
    </div>
  );
};

export default PlaceCard;