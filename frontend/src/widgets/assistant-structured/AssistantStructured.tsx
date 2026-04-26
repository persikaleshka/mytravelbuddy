import React from 'react';
import { useTranslation } from 'react-i18next';
import type { AssistantStructured as AssistantStructuredType, ChatMapPoint } from '@/entities/chat/types';
import PlaceCard from '@/widgets/place-card/PlaceCard';
import './index.css';

interface AssistantStructuredProps {
  structured: AssistantStructuredType;
  onShowOnMap: (point: ChatMapPoint) => void;
}

const AssistantStructured: React.FC<AssistantStructuredProps> = ({ structured, onShowOnMap }) => {
  const { t } = useTranslation();

  if (!structured || Object.keys(structured).length === 0) {
    return null;
  }

  const handleShowOnMap = (place: Record<string, unknown>) => {
    const latitude = place.latitude as number | undefined;
    const longitude = place.longitude as number | undefined;
    if (latitude == null || longitude == null) return;
    const point = {
      location_id: (place.location_id as string) || '',
      name: (place.name as string) || '',
      category: (place.category as string) || 'place',
      latitude,
      longitude,
      day: place.day as number | undefined,
      reason: place.reason as string | undefined,
    };
    onShowOnMap(point);
  };

  return (
    <div className="assistant-structured">
      {structured.summary && (
        <div className="structured-section summary-section">
          <h4>{t('structured.summary')}</h4>
          {Array.isArray(structured.summary)
            ? <ul>{structured.summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
            : <p>{structured.summary}</p>
          }
        </div>
      )}

      {structured.plan && structured.plan.length > 0 && (
        <div className="structured-section plan-section">
          <h4>{t('structured.plan')}</h4>
          <ul>
            {structured.plan.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {structured.questions && structured.questions.length > 0 && (
        <div className="structured-section questions-section">
          <h4>{t('structured.questions')}</h4>
          <ul>
            {structured.questions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ul>
        </div>
      )}

      {structured.places && structured.places.length > 0 && (
        <div className="structured-section places-section">
          <h4>{t('structured.places')}</h4>
          <div className="places-list">
            {structured.places.map((place, index) => (
              <PlaceCard
                key={index}
                name={place.name}
                day={place.day}
                reason={place.reason}
                onShowOnMap={() => handleShowOnMap(place)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssistantStructured;
