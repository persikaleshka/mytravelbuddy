import React from 'react';
import type { AssistantStructured as AssistantStructuredType, ChatMapPoint } from '@/entities/chat/types';
import PlaceCard from '@/widgets/place-card/PlaceCard';
import './index.css';

interface AssistantStructuredProps {
  structured: AssistantStructuredType;
  onShowOnMap: (point: ChatMapPoint) => void;
}

const AssistantStructured: React.FC<AssistantStructuredProps> = ({ structured, onShowOnMap }) => {
  if (!structured || Object.keys(structured).length === 0) {
    return null;
  }

  const handleShowOnMap = (place: Record<string, unknown>) => {
    // Создаем временный объект точки для отображения на карте
    const point = {
      location_id: '', // Неизвестно без поиска в БД
      name: place.name as string || '',
      category: 'place', // По умолчанию
      latitude: 0, // Неизвестно без поиска в БД
      longitude: 0, // Неизвестно без поиска в БД
      day: place.day as number | undefined,
      reason: place.reason as string | undefined
    };
    onShowOnMap(point);
  };

  return (
    <div className="assistant-structured">
      {structured.summary && (
        <div className="structured-section summary-section">
          <h4>Короткий вывод</h4>
          <p>{structured.summary}</p>
        </div>
      )}

      {structured.plan && structured.plan.length > 0 && (
        <div className="structured-section plan-section">
          <h4>План/советы</h4>
          <ul>
            {structured.plan.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {structured.questions && structured.questions.length > 0 && (
        <div className="structured-section questions-section">
          <h4>Вопросы для уточнения</h4>
          <ul>
            {structured.questions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ul>
        </div>
      )}

      {structured.places && structured.places.length > 0 && (
        <div className="structured-section places-section">
          <h4>Предложенные места</h4>
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