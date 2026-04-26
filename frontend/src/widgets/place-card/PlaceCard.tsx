import React from 'react';
import { useTranslation } from 'react-i18next';
import './index.css';

interface PlaceCardProps {
  name: string;
  day?: number;
  reason?: string;
  onShowOnMap: () => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ name, day, reason, onShowOnMap }) => {
  const { t } = useTranslation();
  return (
    <div className="place-card">
      <h3 className="place-name">{name}</h3>
      {day && <p className="place-day">{t('placeCard.day', { day })}</p>}
      {reason && <p className="place-reason">{reason}</p>}
      <button className="show-on-map-button" onClick={onShowOnMap}>
        {t('placeCard.showOnMap')}
      </button>
    </div>
  );
};

export default PlaceCard;
