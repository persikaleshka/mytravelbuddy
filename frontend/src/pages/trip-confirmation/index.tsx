import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './TripConfirmation.css';

const TripConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="trip-confirmation-page">
      <div className="trip-confirmation-container">
        <div className="confirmation-content">
          <h1>{t('tripConfirmation.title')}</h1>
          <p>{t('tripConfirmation.subtitle')}</p>
          <div className="confirmation-actions">
            <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
              {t('tripConfirmation.viewAll')}
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/create-trip')}>
              {t('tripConfirmation.createAnother')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripConfirmationPage;
