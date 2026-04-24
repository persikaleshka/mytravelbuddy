import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserRoutes } from '@/shared/api/hooks/routes';
import './Dashboard.css';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: routes, isPending, isError, error } = useUserRoutes();

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>{t('dashboard.title')}</h1>
        <button className="btn btn-primary" onClick={() => navigate('/create-trip')}>
          {t('dashboard.createTrip')}
        </button>
      </div>

      {isPending && (
        <div className="loading-state">
          <p>{t('dashboard.loading')}</p>
        </div>
      )}

      {isError && (
        <div className="error-state">
          <p>{t('dashboard.errorLoading', { message: error?.message || '' })}</p>
        </div>
      )}

      {routes && routes.length === 0 && (
        <div className="empty-state">
          <p>{t('dashboard.empty')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/create-trip')}>
            {t('dashboard.createFirst')}
          </button>
        </div>
      )}

      {routes && routes.length > 0 && (
        <div className="routes-list">
          {routes.map((route) => (
            <div
              key={route.id}
              className="route-card"
              onClick={() => navigate(`/trip/${route.id}`)}
            >
              <h3>{route.name}</h3>
              <p>{t('dashboard.city', { city: route.city })}</p>
              <div className="route-meta">
                <span>{t('dashboard.dateStart', { date: new Date(route.start_date).toLocaleDateString() })}</span>
                <span>{t('dashboard.dateEnd', { date: new Date(route.end_date).toLocaleDateString() })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
